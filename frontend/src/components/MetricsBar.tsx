import type { QueryResponse } from '../types'

interface Props {
  history: QueryResponse[]
}

export function MetricsBar({ history }: Props) {
  if (history.length === 0) return null

  const allTraces = history.map((h) => h.trace)
  const avgLatency = Math.round(allTraces.reduce((a, t) => a + t.latencyMs, 0) / allTraces.length)
  const totalTokens = allTraces.reduce((a, t) => a + t.inputTokens + t.outputTokens, 0)
  const allAnalyses = history.flatMap((h) => h.analyses)
  const bullishCount = allAnalyses.filter((a) => a.sentiment === 'bullish').length
  const bearishCount = allAnalyses.filter((a) => a.sentiment === 'bearish').length

  return (
    <div
      className="flex items-center gap-0 text-xs border-b"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <Stat label="queries" value={String(history.length)} />
      <Sep />
      <Stat label="avg latency" value={`${avgLatency}ms`} />
      <Sep />
      <Stat label="tokens" value={totalTokens.toLocaleString()} />
      <Sep />
      <Stat
        label="bullish"
        value={`${bullishCount}/${allAnalyses.length}`}
        color={bullishCount >= bearishCount ? 'var(--green)' : 'var(--red)'}
      />
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ color: color ?? 'var(--text-2)' }}>{value}</span>
    </div>
  )
}

function Sep() {
  return <span className="py-2" style={{ color: 'var(--border)' }}>|</span>
}
