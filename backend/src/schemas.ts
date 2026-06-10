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
