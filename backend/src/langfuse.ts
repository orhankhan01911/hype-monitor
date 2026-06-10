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

export function createAnalysisTrace(coin: string) {
  const lf = getLangfuse()
  const trace = lf.trace({
    name: 'funding-analysis',
    metadata: { coin, source: 'hyperliquid' },
  })
  return { trace, flush: () => lf.flushAsync() }
}
