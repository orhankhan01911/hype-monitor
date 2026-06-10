import 'dotenv/config'
import { generateObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'
import { fetchHypeFundingRate } from './hyperliquid'
import { createAnalysisTrace } from './langfuse'
import { AnalysisResultSchema, TraceLogSchema, APIResponse } from './schemas'

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
})

const AnalysisOutputSchema = z.object({
  sentiment: z.enum(['bullish', 'bearish', 'neutral']),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  recommendation: z.enum(['long', 'short', 'wait']),
  riskLevel: z.enum(['low', 'medium', 'high']),
})

export async function runFundingAnalysis(): Promise<APIResponse> {
  const start = Date.now()

  // Step 1: Fetch live Hyperliquid data
  const funding = await fetchHypeFundingRate()

  // Step 2: Create Langfuse trace
  const { trace, flush } = createAnalysisTrace(funding.coin)

  const span = trace.span({
    name: 'ai-analysis',
    input: { fundingRate: funding.fundingRate, premium: funding.premium },
  })

  const userPrompt = `Analyze this Hyperliquid perpetuals funding data for ${funding.coin}:
- Funding Rate: ${(funding.fundingRate * 100).toFixed(4)}% per 8h
- Premium: ${(funding.premium * 100).toFixed(4)}%
- Timestamp: ${new Date(funding.timestamp).toISOString()}

Positive funding means longs pay shorts (market is bullish/overextended long).
Negative funding means shorts pay longs (market is bearish/overextended short).

Provide: sentiment (bullish/bearish/neutral), confidence 0-1, a 1-sentence summary, trading recommendation (long/short/wait), and risk level.`

  // Step 3: Log generation intent to Langfuse
  const generation = trace.generation({
    name: 'funding-interpretation',
    model: 'anthropic/claude-3-haiku',
    input: [{ role: 'user', content: userPrompt }],
  })

  // Step 4: Run through Vercel AI SDK → OpenRouter
  const { object, usage } = await generateObject({
    model: openrouter('anthropic/claude-3-haiku'),
    schema: AnalysisOutputSchema,
    messages: [
      {
        role: 'system',
        content: 'You are a DeFi analyst specializing in perpetuals funding rate interpretation. Be precise and data-driven.',
      },
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

  // Step 6: Assemble typed response
  const analysis = AnalysisResultSchema.parse({
    coin: funding.coin,
    fundingRate: funding.fundingRate,
    ...object,
    timestamp: funding.timestamp,
  })

  const traceLog = TraceLogSchema.parse({
    traceId: trace.id,
    coin: funding.coin,
    model: 'anthropic/claude-3-haiku',
    inputTokens: usage?.promptTokens ?? 0,
    outputTokens: usage?.completionTokens ?? 0,
    latencyMs,
    langfuseUrl: `${process.env.LANGFUSE_HOST ?? 'https://cloud.langfuse.com'}/trace/${trace.id}`,
    timestamp: Date.now(),
  })

  return { analysis, trace: traceLog }
}
