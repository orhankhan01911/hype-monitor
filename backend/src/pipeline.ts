import 'dotenv/config'
import { generateObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'
import { fetchTopFundingRates } from './hyperliquid'
import { createAnalysisTrace } from './langfuse'
import { AnalysisResultSchema, TraceLogSchema, QueryResponse } from './schemas'

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
})

// Schema for what the LLM returns — includes natural language response + per-coin analyses
const QueryOutputSchema = z.object({
  aiResponse: z.string().describe('Direct answer to the trader\'s question in 2-4 sentences. Be specific about coins and numbers.'),
  analyses: z.array(z.object({
    coin: z.string(),
    sentiment: z.enum(['bullish', 'bearish', 'neutral']),
    confidence: z.number().min(0).max(1),
    summary: z.string().describe('One sentence about this coin\'s funding situation.'),
    recommendation: z.enum(['long', 'short', 'wait']),
    riskLevel: z.enum(['low', 'medium', 'high']),
  })).min(1).max(4).describe('Focus on the 1-4 coins most relevant to the trader\'s query.'),
})

export async function runFundingAnalysis(userQuery: string): Promise<QueryResponse> {
  const start = Date.now()

  // Step 1: Fetch live funding rates (top 15 coins + HYPE/BTC/ETH/SOL always included)
  const rates = await fetchTopFundingRates(15)

  // Step 2: Create Langfuse trace tagged with the user query
  const { trace, flush } = createAnalysisTrace(userQuery)

  const ratesTable = rates
    .map((r) => {
      const sign = r.fundingRate >= 0 ? '+' : ''
      const annualized = (r.fundingRate * 3 * 365 * 100).toFixed(1)
      return `${r.coin.padEnd(8)} ${sign}${(r.fundingRate * 100).toFixed(4)}%/8h  (${annualized}% ann)  premium: ${(r.premium * 100).toFixed(4)}%`
    })
    .join('\n')

  const systemPrompt = `You are a DeFi perpetuals trading assistant on a Hyperliquid terminal.
Positive funding = longs pay shorts = market is overextended long = bearish signal for new longs.
Negative funding = shorts pay longs = market is overextended short = bullish signal for new longs.
High absolute funding = high carry cost for the leveraged side.
Be direct, precise, and actionable. Use actual numbers from the data.`

  const userPrompt = `Trader query: "${userQuery}"

Current Hyperliquid funding rates (live data):
${ratesTable}

Answer the trader's question directly. Focus on the 1-4 most relevant coins based on their query.
If they ask about a specific coin not in the list, say it wasn't available in the current data set.`

  // Step 3: Log to Langfuse
  const span = trace.span({
    name: 'query-analysis',
    input: { userQuery, coinsAnalyzed: rates.length },
  })

  const generation = trace.generation({
    name: 'trader-query-response',
    model: 'anthropic/claude-3-haiku',
    input: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  })

  // Step 4: Vercel AI SDK → OpenRouter → LLM
  const { object, usage } = await generateObject({
    model: openrouter('anthropic/claude-3-haiku'),
    schema: QueryOutputSchema,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  })

  const latencyMs = Date.now() - start

  // Step 5: Close Langfuse spans
  generation.end({
    output: object,
    usage: {
      promptTokens: usage?.promptTokens ?? 0,
      completionTokens: usage?.completionTokens ?? 0,
    },
  })
  span.end({ output: object })
  await flush()

  // Step 6: Merge funding rate data into each coin analysis
  const rateMap = new Map(rates.map((r) => [r.coin, r]))
  const now = Date.now()

  const analyses = object.analyses.map((a) => {
    const rate = rateMap.get(a.coin.toUpperCase())
    return AnalysisResultSchema.parse({
      coin: a.coin.toUpperCase(),
      fundingRate: rate?.fundingRate ?? 0,
      sentiment: a.sentiment,
      confidence: a.confidence,
      summary: a.summary,
      recommendation: a.recommendation,
      riskLevel: a.riskLevel,
      timestamp: rate?.timestamp ?? now,
    })
  })

  const traceLog = TraceLogSchema.parse({
    traceId: trace.id,
    model: 'anthropic/claude-3-haiku',
    inputTokens: usage?.promptTokens ?? 0,
    outputTokens: usage?.completionTokens ?? 0,
    latencyMs,
    langfuseUrl: `${process.env.LANGFUSE_BASE_URL ?? 'https://cloud.langfuse.com'}/trace/${trace.id}`,
    timestamp: now,
  })

  return {
    userQuery,
    aiResponse: object.aiResponse,
    analyses,
    trace: traceLog,
  }
}
