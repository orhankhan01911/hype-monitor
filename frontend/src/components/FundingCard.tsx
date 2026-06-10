import { motion } from 'framer-motion'
import type { AnalysisResult } from '../types'

interface Props {
  analysis: AnalysisResult
  isLoading?: boolean
  compact?: boolean
}

const SENTIMENT_COLOR = {
  bullish: 'var(--cyan)',
  bearish: '#ff4d6d',
  neutral: 'var(--label)',
}

const REC_LABEL = { long: 'long', short: 'short', wait: 'wait' }
const REC_COLOR = { long: 'var(--cyan)', short: '#ff4d6d', wait: 'var(--label)' }

export function FundingCard({ analysis, compact = false }: Props) {
  const color = SENTIMENT_COLOR[analysis.sentiment]
  const rateSign = analysis.fundingRate >= 0 ? '+' : ''
  const annualized = (analysis.fundingRate * 3 * 365 * 100).toFixed(1)

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="rounded border px-4 py-3"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs" style={{ color: 'var(--label)' }}>{analysis.coin}</span>
          <span className="text-xs" style={{ color }}>
            {analysis.sentiment}
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-lg font-bold tabular-nums" style={{ color }}>
            {rateSign}{(analysis.fundingRate * 100).toFixed(4)}%
          </span>
          <span style={{ color: 'var(--label)', fontSize: '11px' }}>/8h · {annualized}% ann</span>
        </div>

        {/* Confidence bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px overflow-hidden" style={{ background: 'var(--border)' }}>
            <motion.div
              className="h-full"
              style={{ background: color }}
              initial={{ width: 0 }}
              animate={{ width: `${analysis.confidence * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span style={{ color: 'var(--label)', fontSize: '10px' }}>
            {REC_LABEL[analysis.recommendation]}
          </span>
        </div>
      </motion.div>
    )
  }

  // Full card
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded border p-5"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p style={{ color: 'var(--label)', fontSize: '11px' }}>{analysis.coin} / USDC perp</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-bold tabular-nums" style={{ color }}>
              {rateSign}{(analysis.fundingRate * 100).toFixed(4)}%
            </span>
            <span style={{ color: 'var(--label)', fontSize: '11px' }}>/8h</span>
          </div>
          <p style={{ color: 'var(--label)', fontSize: '11px' }}>{annualized}% annualized</p>
        </div>

        <div className="text-right">
          <p className="text-xs mb-1" style={{ color }}>
            {analysis.sentiment}
          </p>
          <p className="text-xs" style={{ color: REC_COLOR[analysis.recommendation] }}>
            {REC_LABEL[analysis.recommendation]}
          </p>
        </div>
      </div>

      <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--body)' }}>
        {analysis.summary}
      </p>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }}>
          <motion.div
            className="h-full"
            style={{ background: color }}
            initial={{ width: 0 }}
            animate={{ width: `${analysis.confidence * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <span style={{ color: 'var(--label)', fontSize: '10px', flexShrink: 0 }}>
          {(analysis.confidence * 100).toFixed(0)}% conf
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded-sm"
          style={{
            color: analysis.riskLevel === 'high' ? '#ff4d6d' : analysis.riskLevel === 'medium' ? '#f59e0b' : 'var(--label)',
            border: '1px solid var(--border)',
          }}
        >
          {analysis.riskLevel}
        </span>
      </div>
    </motion.div>
  )
}
