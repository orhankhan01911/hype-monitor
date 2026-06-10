import { z } from 'zod'

export const FundingRateSchema = z.object({
  coin: z.string(),
  fundingRate: z.number(),
  premium: z.number(),
  timestamp: z.number(),
})
export type FundingRate = z.infer<typeof FundingRateSchema>

export const AnalysisResultSchema = z.object({
  coin: z.string(),
  fundingRate: z.number(),
  sentiment: z.enum(['bullish', 'bearish', 'neutral']),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  recommendation: z.enum(['long', 'short', 'wait']),
  riskLevel: z.enum(['low', 'medium', 'high']),
  timestamp: z.number(),
})
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>

export const TraceLogSchema = z.object({
  traceId: z.string(),
  model: z.string(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  latencyMs: z.number(),
  langfuseUrl: z.string().optional(),
  timestamp: z.number(),
})
export type TraceLog = z.infer<typeof TraceLogSchema>

// New: query-driven response that supports multi-coin + natural language answer
export const QueryResponseSchema = z.object({
  userQuery: z.string(),
  aiResponse: z.string(),       // natural language answer to the trader's question
  analyses: z.array(AnalysisResultSchema),  // 1-3 focused coins
  trace: TraceLogSchema,
})
export type QueryResponse = z.infer<typeof QueryResponseSchema>

// --- Domain-rich schemas added in the tool-calling upgrade ---

// A single historical funding observation for one coin.
export const FundingHistoryEntrySchema = z.object({
  time: z.number(),         // epoch ms
  fundingRate: z.number(),  // per-8h funding as a decimal
  coin: z.string(),
})
export type FundingHistoryEntry = z.infer<typeof FundingHistoryEntrySchema>

// Pair-trade spread between two coins' funding rates.
export const PairSpreadSchema = z.object({
  coinA: z.string(),
  coinB: z.string(),
  rateA: z.number(),                 // coinA per-8h funding (decimal)
  rateB: z.number(),                 // coinB per-8h funding (decimal)
  spreadBps: z.number(),             // (rateA - rateB) in basis points
  netCarryAnnualized: z.number(),    // (rateA - rateB) * 3 * 365 (decimal/yr)
  favoredSide: z.enum(['long_a_short_b', 'long_b_short_a', 'neutral']),
})
export type PairSpread = z.infer<typeof PairSpreadSchema>

// Predicted funding across venues for one coin.
export const PredictedFundingSchema = z.object({
  coin: z.string(),
  hlFunding: z.number(),
  binanceFunding: z.number().optional(),
  bybitFunding: z.number().optional(),
})
export type PredictedFunding = z.infer<typeof PredictedFundingSchema>
