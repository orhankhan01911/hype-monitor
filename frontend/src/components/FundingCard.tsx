import { motion } from 'framer-motion'
import type { AnalysisResult } from '../types'

interface Props {
  analysis: AnalysisResult
  isLoading: boolean
}

const SENTIMENT_COLOR = {
  bullish: '#00D4FF',
  bearish: '#FF4D6D',
  neutral: '#8B9EC7',
}

const REC_LABEL = {
  long: '▲ LONG',
  short: '▼ SHORT',
  wait: '◈ WAIT',
}

const RISK_COLOR = {
  low: '#00D4FF',
  medium: '#F59E0B',
  high: '#FF4D6D',
}

export function FundingCard({ analysis, isLoading }: Props) {
  const color = SENTIMENT_COLOR[analysis.sentiment]
  const annualizedRate = (analysis.fundingRate * 3 * 365 * 100).toFixed(2)
  const rateSign = analysis.fundingRate >= 0 ? '+' : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{ borderColor: color }}
      className="relative border rounded-lg p-6 bg-[#0d1117] overflow-hidden"
    >
      {isLoading && (
        <motion.div
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        />
      )}

      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[#8B9EC7] text-xs font-mono tracking-widest uppercase">HYPE / USDC Perp</p>
          <p className="text-white text-3xl font-bold font-mono mt-1">
            {rateSign}{(analysis.fundingRate * 100).toFixed(4)}%
            <span className="text-sm text-[#8B9EC7] ml-2">/ 8h</span>
          </p>
          <p className="text-[#8B9EC7] text-xs font-mono mt-1">{annualizedRate}% annualized</p>
        </div>
        <motion.div
          key={analysis.sentiment}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-xs font-mono px-3 py-1 rounded border"
          style={{ color, borderColor: color, background: `${color}15` }}
        >
          {analysis.sentiment.toUpperCase()}
        </motion.div>
      </div>

      <p className="text-[#C8D6EF] text-sm font-sans mb-4 leading-relaxed">{analysis.summary}</p>

      <div className="flex items-center gap-4 mb-3">
        <div className="flex-1 bg-[#161b22] rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: color }}
            initial={{ width: 0 }}
            animate={{ width: `${analysis.confidence * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
        <span className="text-[#8B9EC7] text-xs font-mono flex-shrink-0">
          {(analysis.confidence * 100).toFixed(0)}% conf
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span
          className="text-xs font-mono px-2 py-1 rounded border"
          style={{ color, borderColor: `${color}60`, background: `${color}15` }}
        >
          {REC_LABEL[analysis.recommendation]}
        </span>
        <span
          className="text-xs font-mono px-2 py-1 rounded"
          style={{ color: RISK_COLOR[analysis.riskLevel], background: `${RISK_COLOR[analysis.riskLevel]}15` }}
        >
          {analysis.riskLevel.toUpperCase()} RISK
        </span>
        <span className="text-[#8B9EC7] text-xs font-mono ml-auto">
          {new Date(analysis.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </motion.div>
  )
}
