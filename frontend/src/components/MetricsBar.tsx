import { motion } from 'framer-motion'
import type { QueryResponse } from '../types'

interface Props {
  history: QueryResponse[]
}

export function MetricsBar({ history }: Props) {
  const allTraces = history.map((h) => h.trace)
  const avgLatency = allTraces.length > 0
    ? Math.round(allTraces.reduce((a, t) => a + t.latencyMs, 0) / allTraces.length)
    : 0
  const totalTokens = allTraces.reduce((a, t) => a + t.inputTokens + t.outputTokens, 0)
  const allAnalyses = history.flatMap((h) => h.analyses)
  const bullishPct = allAnalyses.length > 0
    ? Math.round((allAnalyses.filter((a) => a.sentiment === 'bullish').length / allAnalyses.length) * 100)
    : 0

  const metrics = [
    { label: 'QUERIES', value: history.length.toString(), color: '#00D4FF' },
    { label: 'AVG LATENCY', value: avgLatency ? `${avgLatency}ms` : '—', color: '#00D4FF' },
    { label: 'TOTAL TOKENS', value: totalTokens ? totalTokens.toLocaleString() : '—', color: '#00D4FF' },
    {
      label: 'BULLISH %',
      value: allAnalyses.length ? `${bullishPct}%` : '—',
      color: bullishPct >= 50 ? '#00D4FF' : '#FF4D6D',
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-3">
      {metrics.map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className="bg-[#0d1117] rounded border border-[#1e2736] p-3 text-center"
        >
          <p className="text-[#8B9EC7] text-[9px] font-mono tracking-widest uppercase mb-1">{m.label}</p>
          <motion.p
            key={m.value}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-mono text-lg font-bold tabular-nums"
            style={{ color: m.color }}
          >
            {m.value}
          </motion.p>
        </motion.div>
      ))}
    </div>
  )
}
