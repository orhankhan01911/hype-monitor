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
  coin: string
  model: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
  langfuseUrl?: string
  timestamp: number
}

export interface APIResponse {
  analysis: AnalysisResult
  trace: TraceLog
}
