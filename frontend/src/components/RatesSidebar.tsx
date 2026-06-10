import { motion, AnimatePresence } from 'framer-motion'
import type { FundingRate } from '../types'

interface Props {
  rates: FundingRate[]
  activeCoin?: string
  isRefreshing: boolean
}

export function RatesSidebar({ rates, activeCoin, isRefreshing }: Props) {
  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      style={{ background: 'var(--surface)' }}
    >
      {/* Sidebar header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="text-xs font-medium tracking-wide" style={{ color: 'var(--text-2)' }}>
          FUNDING RATES
        </span>
        <motion.div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: isRefreshing ? 'var(--yellow)' : 'var(--green)' }}
          animate={{ opacity: isRefreshing ? [1, 0.3, 1] : 1 }}
          transition={{ duration: 0.7, repeat: isRefreshing ? Infinity : 0 }}
        />
      </div>

      {/* Column headers */}
      <div
        className="grid px-4 py-2 text-xs border-b"
        style={{
          gridTemplateColumns: '60px 1fr auto',
          borderColor: 'var(--border-2)',
          color: 'var(--muted)',
        }}
      >
        <span>PERP</span>
        <span>8H RATE</span>
        <span>ANN</span>
      </div>

      {/* Rates list */}
      <div className="flex-1 overflow-y-auto">
        {rates.length === 0 ? (
          <div className="px-4 py-6 text-xs" style={{ color: 'var(--muted)' }}>
            Loading…
          </div>
        ) : (
          rates.map((r) => {
            const isPos = r.fundingRate >= 0
            const color = isPos ? 'var(--green)' : 'var(--red)'
            const sign = isPos ? '+' : ''
            const ann = (r.fundingRate * 3 * 365 * 100).toFixed(0)
            const isActive = activeCoin === r.coin

            return (
              <AnimatePresence key={r.coin} initial={false}>
                <motion.div
                  className="grid px-4 py-2 text-xs transition-colors"
                  style={{
                    gridTemplateColumns: '60px 1fr auto',
                    background: isActive ? 'var(--surface-2)' : 'transparent',
                    borderLeft: isActive ? '2px solid var(--blue)' : '2px solid transparent',
                  }}
                  animate={isActive ? { backgroundColor: 'var(--surface-2)' } : {}}
                >
                  <span
                    className="font-medium"
                    style={{ color: isActive ? 'var(--text)' : 'var(--text-2)' }}
                  >
                    {r.coin}
                  </span>
                  <span className="tabular-nums" style={{ color }}>
                    {sign}{(r.fundingRate * 100).toFixed(4)}%
                  </span>
                  <span className="tabular-nums" style={{ color: 'var(--muted)' }}>
                    {sign}{ann}%
                  </span>
                </motion.div>
              </AnimatePresence>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div
        className="px-4 py-2 text-xs border-t"
        style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
      >
        Hyperliquid · refreshes 30s
      </div>
    </div>
  )
}
