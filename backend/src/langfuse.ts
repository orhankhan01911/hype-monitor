import Langfuse from 'langfuse'

let _client: Langfuse | null = null

export function getLangfuse(): Langfuse {
  if (!_client) {
    _client = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
      secretKey: process.env.LANGFUSE_SECRET_KEY!,
      baseUrl: process.env.LANGFUSE_BASE_URL ?? 'https://cloud.langfuse.com',
    })
  }
  return _client
}

/**
 * Legacy single-shot trace (kept for backwards compatibility).
 */
export function createAnalysisTrace(userQuery: string) {
  const lf = getLangfuse()
  const trace = lf.trace({
    name: 'funding-analysis',
    input: userQuery,
    metadata: { source: 'hyperliquid', queryLength: userQuery.length },
  })
  return { trace, flush: () => lf.flushAsync() }
}

/**
 * Session-attached trace. Multiple turns sharing the same sessionId are grouped
 * in the Langfuse Sessions view, giving a per-conversation transcript.
 */
export function createSessionTrace(sessionId: string, userQuery: string) {
  const lf = getLangfuse()
  const trace = lf.trace({
    name: 'funding-analysis',
    sessionId,
    input: userQuery,
    metadata: {
      source: 'hyperliquid',
      sessionId,
      queryLength: userQuery.length,
    },
  })
  return { trace, flush: () => lf.flushAsync() }
}

/**
 * Default "response completed and was schema-valid" quality score.
 * Later this can be replaced/augmented by a real user thumbs-up/down.
 */
export function scoreResponseQuality(
  traceId: string,
  value = 1.0,
  comment = 'schema-valid'
): void {
  getLangfuse().score({
    traceId,
    name: 'response_quality',
    value,
    comment,
  })
}

/**
 * Score the trace against a latency SLA:
 *   <3000ms -> 1.0, <8000ms -> 0.5, otherwise 0.0.
 */
export function scoreLatency(traceId: string, latencyMs: number): void {
  const value = latencyMs < 3000 ? 1.0 : latencyMs < 8000 ? 0.5 : 0.0
  getLangfuse().score({
    traceId,
    name: 'latency_sla',
    value,
    comment: `${latencyMs}ms`,
  })
}

/**
 * AI SDK experimental_telemetry settings.
 *
 * NOTE: experimental_telemetry is an OpenTelemetry feature of the `ai` package
 * (passed to streamText/generateText, NOT to createOpenAI/openrouter()). To
 * actually export spans you must register an OTel SDK + a Langfuse OTel
 * exporter at process start. We don't ship that wiring here, so telemetry is
 * disabled by default to avoid no-op overhead. Langfuse instrumentation in
 * this codebase is done explicitly via trace/generation/score calls instead.
 *
 * Flip HYPE_OTEL_ENABLED=1 once an OTel tracer is registered to turn it on.
 */
export function telemetrySettings(functionId: string) {
  return {
    isEnabled: process.env.HYPE_OTEL_ENABLED === '1',
    functionId,
  } as const
}

export function langfuseTraceUrl(traceId: string): string {
  const base = process.env.LANGFUSE_BASE_URL ?? 'https://cloud.langfuse.com'
  return `${base}/trace/${traceId}`
}
