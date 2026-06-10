import 'dotenv/config'
import { generateText, streamText, tool } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'
import {
  fetchFundingRate,
  fetchTopFundingRates,
  fetchFundingHistory,
  fetchPairSpread,
  fetchPredictedFundings,
} from './hyperliquid'
import {
  createSessionTrace,
  scoreResponseQuality,
  scoreLatency,
  telemetrySettings,
  langfuseTraceUrl,
} from './langfuse'
import { TraceLogSchema, QueryResponse } from './schemas'

const DEFAULT_MODEL = 'google/gemma-4-31b-it:free'
const ALLOWED_MODELS = new Set([
  'google/gemma-4-31b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'anthropic/claude-haiku-4.5',
  'anthropic/claude-sonnet-4.6',
])
const MAX_STEPS = 5

function resolveModel(modelId?: string): string {
  if (modelId && ALLOWED_MODELS.has(modelId)) return modelId
  return DEFAULT_MODEL
}

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
})

const SYSTEM_PROMPT = `You are a DeFi perpetuals trading assistant on Hyperliquid. Use your tools to fetch live data before answering. For specific coin questions, call getFundingRate. For comparisons, call comparePair. For market overview, call getTopFundingRates. For trend analysis, call getFundingHistory. Always fetch data before answering — don't guess rates. Positive funding means longs pay shorts (bearish for new longs). Negative funding means shorts pay longs (bullish for new longs).`

/**
 * Tool set shared by the streaming and sync entry points. Each tool wraps a
 * live Hyperliquid fetch and returns plain data the model can reason over.
 */
const tools = {
  getFundingRate: tool({
    description:
      'Get the current funding rate and premium for a single coin on Hyperliquid.',
    parameters: z.object({
      coin: z.string().describe('Coin symbol, e.g. BTC, ETH, HYPE, SOL.'),
    }),
    execute: async ({ coin }) => fetchFundingRate(coin),
  }),
  getTopFundingRates: tool({
    description:
      'Get the top funding rates across Hyperliquid (HYPE/BTC/ETH/SOL plus the highest-magnitude movers). Use for market overview.',
    parameters: z.object({
      limit: z.number().default(10).describe('How many coins to return.'),
    }),
    execute: async ({ limit }) => fetchTopFundingRates(limit),
  }),
  getFundingHistory: tool({
    description:
      'Get recent funding-rate history for one coin to analyze the trend over time.',
    parameters: z.object({
      coin: z.string().describe('Coin symbol to fetch history for.'),
      periods: z
        .number()
        .default(20)
        .describe('Number of most-recent funding periods to return.'),
    }),
    execute: async ({ coin, periods }) => fetchFundingHistory(coin, periods),
  }),
  comparePair: tool({
    description:
      'Compare two coins as a funding pair-trade: returns spread, annualized net carry, and which side is favored.',
    parameters: z.object({
      coinA: z.string().describe('First coin in the pair.'),
      coinB: z.string().describe('Second coin in the pair.'),
    }),
    execute: async ({ coinA, coinB }) => fetchPairSpread(coinA, coinB),
  }),
  getPredictedFundings: tool({
    description:
      'Get predicted funding across venues (Hyperliquid vs Binance vs Bybit) to spot cross-venue divergence.',
    parameters: z.object({}),
    execute: async () => fetchPredictedFundings(),
  }),
} as const

/**
 * Streaming entry point: returns the live streamText result plus session/trace
 * ids. The server pipes `result` to the HTTP response; Langfuse instrumentation
 * (generation + scores) is wired into onFinish.
 *
 * The return type is inferred (not annotated) so `result`'s precise tool
 * generics survive — annotating it widens tools to Record<string, CoreTool>
 * and strips pipeDataStreamToResponse off the type.
 */
export async function runFundingAnalysis(
  userQuery: string,
  sessionId: string,
  modelId?: string
) {
  const model = resolveModel(modelId)
  const start = Date.now()
  const { trace, flush } = createSessionTrace(sessionId, userQuery)
  const traceId = trace.id

  const generation = trace.generation({
    name: 'trader-query-response',
    model,
    input: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userQuery },
    ],
  })

  const result = await streamText({
    model: openrouter(model),
    system: SYSTEM_PROMPT,
    prompt: userQuery,
    tools,
    maxSteps: MAX_STEPS,
    maxTokens: 1024,
    experimental_telemetry: telemetrySettings('runFundingAnalysis'),
    onFinish: async ({ text, usage }) => {
      const latencyMs = Date.now() - start
      generation.end({
        output: text,
        usage: {
          promptTokens: usage?.promptTokens ?? 0,
          completionTokens: usage?.completionTokens ?? 0,
        },
      })
      trace.update({ output: text })
      scoreResponseQuality(traceId)
      scoreLatency(traceId, latencyMs)
      await flush()
    },
  })

  return { result, sessionId, traceId }
}

/** Inferred shape of the streaming pipeline result. */
export type StreamingPipelineResult = Awaited<
  ReturnType<typeof runFundingAnalysis>
>

/**
 * Synchronous entry point (used by /api/analyze for history storage and
 * backwards compatibility). Same tools + maxSteps, but awaits completion and
 * returns a QueryResponse. analyses are left empty — the agent answers in prose.
 */
export async function runFundingAnalysisSync(
  userQuery: string,
  sessionId = 'sync',
  modelId?: string
): Promise<QueryResponse> {
  const model = resolveModel(modelId)
  const start = Date.now()
  const { trace, flush } = createSessionTrace(sessionId, userQuery)
  const traceId = trace.id

  const generation = trace.generation({
    name: 'trader-query-response',
    model,
    input: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userQuery },
    ],
  })

  const { text, usage } = await generateText({
    model: openrouter(model),
    system: SYSTEM_PROMPT,
    prompt: userQuery,
    tools,
    maxSteps: MAX_STEPS,
    maxTokens: 1024,
    experimental_telemetry: telemetrySettings('runFundingAnalysisSync'),
  })

  const latencyMs = Date.now() - start
  const now = Date.now()

  generation.end({
    output: text,
    usage: {
      promptTokens: usage?.promptTokens ?? 0,
      completionTokens: usage?.completionTokens ?? 0,
    },
  })
  trace.update({ output: text })
  scoreResponseQuality(traceId)
  scoreLatency(traceId, latencyMs)
  await flush()

  const traceLog = TraceLogSchema.parse({
    traceId,
    model,
    inputTokens: usage?.promptTokens ?? 0,
    outputTokens: usage?.completionTokens ?? 0,
    latencyMs,
    langfuseUrl: langfuseTraceUrl(traceId),
    timestamp: now,
  })

  return {
    userQuery,
    aiResponse: text,
    analyses: [],
    trace: traceLog,
  }
}
