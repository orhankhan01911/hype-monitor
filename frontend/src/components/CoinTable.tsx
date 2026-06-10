import { motion } from 'framer-motion'
import type { AnalysisResult } from '../types'

interface Props {
  analyses: AnalysisResult[]
}

const REC_COLOR: Record<string, string> = {
  long: 'var(--green)',
  short: 'var(--red)',
  wait: 'var(--muted)',
}

const SENT_COLOR: Record<string, string> = {
  bullish: 'var(--green)',
  bearish: 'var(--red)',
  neutral: 'var(--muted)',
}

export function CoinTable({ analyses }: Props) {
  if (analyses.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
    >
      {/* Table header */}
      <div
        className="grid text-xs px-4 py-2"
        style={{
          gridTemplateColumns: '60px 100px 80px 50px 50px',
          color: 'var(--muted)',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-2)',
        }}
      >
        <span>PERP</span>
        <span>RATE / 8H</span>
        <span>SENTIMENT</span>
        <span>REC</span>
        <span>CONF</span>
      </div>

      {/* Rows */}
      {analyses.map((a, i) => {
        const sign = a.fundingRate >= 0 ? '+' : ''
        const rateColor = a.fundingRate >= 0 ? 'var(--green)' : 'var(--red)'

        return (
          <div
            key={a.coin}
            className="grid text-xs px-4 py-2.5"
            style={{
              gridTemplateColumns: '60px 100px 80px 50px 50px',
              borderBottom: i < analyses.length - 1 ? '1px solid var(--border-2)' : 'none',
            }}
          >
            <span className="font-medium" style={{ color: 'var(--text)' }}>{a.coin}</span>

            <span className="tabular-nums font-medium" style={{ color: rateColor }}>
              {sign}{(a.fundingRate * 100).toFixed(4)}%
            </span>

            <span style={{ color: SENT_COLOR[a.sentiment] }}>{a.sentiment}</span>

            <span style={{ color: REC_COLOR[a.recommendation] }}>{a.recommendation}</span>

            <span style={{ color: 'var(--text-2)' }}>{(a.confidence * 100).toFixed(0)}%</span>
          </div>
        )
      })}
    </motion.div>
  )
}
