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
      <Divider />
      <Stat label="avg latency" value={`${avgLatency}ms`} />
      <Divider />
      <Stat label="tokens used" value={totalTokens.toLocaleString()} />
      <Divider />
      <Stat
        label="bullish signals"
        value={`${bullishCount}/${allAnalyses.length}`}
        valueColor={bullishCount > bearishCount ? 'var(--cyan)' : '#ff4d6d'}
      />
    </div>
  )
}

function Stat({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <span style={{ color: 'var(--label)' }}>{label}</span>
      <span style={{ color: valueColor ?? 'var(--text)' }}>{value}</span>
    </div>
  )
}

function Divider() {
  return <span style={{ color: 'var(--border)' }}>|</span>
}
