export interface FundingRate {
  coin: string
  fundingRate: number
  premium: number
  timestamp: number
}

export interface AnalysisResult {
  coin: string
  fundingRate: number
  sentiment: 'bullish' | 'bearish' | 'neutral'
  confidence: number
  summary: string
  recommendation: 'long' | 'short' | 'wait'
  riskLevel: 'low' | 'medium' | 'high'
  timestamp: number
}

export interface TraceLog {
  traceId: string
  model: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
  langfuseUrl?: string
  timestamp: number
}

export interface QueryResponse {
  userQuery: string
  aiResponse: string
  analyses: AnalysisResult[]
  trace: TraceLog
}

export interface ToolStep {
  tool: string
  status: 'calling' | 'done'
  summary: string
}

export interface PairSpread {
  coinA: string
  coinB: string
  rateA: number
  rateB: number
  spreadBps: number
  netCarryAnnualized: number
  favoredSide: 'long_a_short_b' | 'long_b_short_a' | 'neutral'
}
