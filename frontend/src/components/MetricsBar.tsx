import { motion } from 'framer-motion'
import type { APIResponse } from '../types'

interface Props {
  traces: APIResponse[]
}

export function MetricsBar({ traces }: Props) {
  const avgLatency = traces.length > 0
    ? Math.round(traces.reduce((a, t) => a + t.trace.latencyMs, 0) / traces.length)
    : 0
  const totalTokens = traces.reduce((a, t) => a + t.trace.inputTokens + t.trace.outputTokens, 0)
  const bullishCount = traces.filter(t => t.analysis.sentiment === 'bullish').length
  const bullishPct = traces.length > 0 ? Math.round((bullishCount / traces.length) * 100) : 0

  const metrics = [
    { label: 'AVG LATENCY', value: avgLatency ? `${avgLatency}ms` : '—', color: '#00D4FF' },
    { label: 'TOTAL TOKENS', value: totalTokens ? totalTokens.toLocaleString() : '—', color: '#00D4FF' },
    { label: 'PIPELINE RUNS', value: traces.length.toString(), color: '#00D4FF' },
    {
      label: 'BULLISH %',
      value: traces.length ? `${bullishPct}%` : '—',
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
          className="bg-[#0d1117] rounded border border-[#1e2736] p-4 text-center"
        >
          <p className="text-[#8B9EC7] text-[9px] font-mono tracking-widest uppercase mb-1.5">
            {m.label}
          </p>
          <motion.p
            key={m.value}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-mono text-xl font-bold tabular-nums"
            style={{ color: m.color }}
          >
            {m.value}
          </motion.p>
        </motion.div>
      ))}
    </div>
  )
}
