import { useState, useMemo } from 'react'
import type { FundingRate } from '../types'

interface Props {
  rates: FundingRate[]
  onSubmit: (query: string) => void
}

const POPULAR_COINS = ['BTC', 'ETH', 'SOL', 'HYPE', 'ARB', 'AVAX', 'MATIC', 'LINK', 'BNB', 'XRP']

export function PairsPanel({ rates, onSubmit }: Props) {
  const [coinA, setCoinA] = useState('BTC')
  const [coinB, setCoinB] = useState('ETH')

  // Build coin list from live rates, falling back to popular coins
  const availableCoins = useMemo(() => {
    const fromRates = rates.map((r) => r.coin)
    if (fromRates.length > 0) return fromRates
    return POPULAR_COINS
  }, [rates])

  // Compute spread from live rates if available
  const spread = useMemo(() => {
    const rA = rates.find((r) => r.coin === coinA)
    const rB = rates.find((r) => r.coin === coinB)
    if (!rA || !rB) return null

    const rateA = rA.fundingRate
    const rateB = rB.fundingRate
    const spreadBps = (rateA - rateB) * 10000
    // Annualized: 3 periods/day * 365 days * difference
    const netCarryAnnualized = (rateA - rateB) * 3 * 365 * 100
    const favoredSide: 'long_a_short_b' | 'long_b_short_a' | 'neutral' =
      Math.abs(spreadBps) < 0.1
        ? 'neutral'
        : spreadBps > 0
          ? 'long_b_short_a' // A pays more → short A, long B
          : 'long_a_short_b' // B pays more → short B, long A

    return { coinA, coinB, rateA, rateB, spreadBps, netCarryAnnualized, favoredSide }
  }, [rates, coinA, coinB])

  const handleAnalyze = () => {
    onSubmit(`compare ${coinA} vs ${coinB} pair spread and funding rates`)
  }

  const spreadColor =
    spread === null
      ? 'var(--muted)'
      : Math.abs(spread.spreadBps) > 5
        ? spread.spreadBps > 0
          ? 'var(--red)'
          : 'var(--green)'
        : 'var(--muted)'

  const favoredLabel =
    spread?.favoredSide === 'long_a_short_b'
      ? `LONG ${coinA} / SHORT ${coinB}`
      : spread?.favoredSide === 'long_b_short_a'
        ? `LONG ${coinB} / SHORT ${coinA}`
        : 'NEUTRAL'

  const favoredColor =
    spread?.favoredSide === 'neutral' ? 'var(--muted)' : 'var(--green)'

  return (
    <div
      className="border-t"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="text-xs font-medium tracking-wide" style={{ color: 'var(--text-2)' }}>
          PAIRS
        </span>
        <button
          onClick={handleAnalyze}
          className="text-xs px-2 py-0.5 rounded-sm transition-colors"
          style={{
            color: 'var(--blue)',
            border: '1px solid var(--border)',
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--blue)'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--blue)'
          }}
        >
          analyze
        </button>
      </div>

      {/* Selectors */}
      <div className="px-4 py-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <CoinSelect
            label="A"
            value={coinA}
            options={availableCoins.filter((c) => c !== coinB)}
            onChange={setCoinA}
          />
          <CoinSelect
            label="B"
            value={coinB}
            options={availableCoins.filter((c) => c !== coinA)}
            onChange={setCoinB}
          />
        </div>

        {/* Spread display */}
        {spread ? (
          <div className="space-y-1.5 pt-1">
            {/* Header */}
            <div className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-data)' }}>
              {coinA}/{coinB} SPREAD
            </div>

            {/* Rate row */}
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="space-y-0.5">
                <div style={{ color: 'var(--muted)' }}>{coinA}</div>
                <div
                  className="tabular-nums font-medium"
                  style={{
                    color: spread.rateA >= 0 ? 'var(--green)' : 'var(--red)',
                    fontFamily: 'var(--font-data)',
                  }}
                >
                  {spread.rateA >= 0 ? '+' : ''}{(spread.rateA * 100).toFixed(4)}%
                </div>
              </div>
              <div className="space-y-0.5">
                <div style={{ color: 'var(--muted)' }}>{coinB}</div>
                <div
                  className="tabular-nums font-medium"
                  style={{
                    color: spread.rateB >= 0 ? 'var(--green)' : 'var(--red)',
                    fontFamily: 'var(--font-data)',
                  }}
                >
                  {spread.rateB >= 0 ? '+' : ''}{(spread.rateB * 100).toFixed(4)}%
                </div>
              </div>
            </div>

            {/* Net carry */}
            <div
              className="flex items-center justify-between text-xs pt-0.5"
              style={{ borderTop: '1px solid var(--border-2)' }}
            >
              <span style={{ color: 'var(--muted)' }}>net carry ann.</span>
              <span
                className="tabular-nums"
                style={{ color: spreadColor, fontFamily: 'var(--font-data)' }}
              >
                {spread.netCarryAnnualized >= 0 ? '+' : ''}{spread.netCarryAnnualized.toFixed(1)}%
              </span>
            </div>

            {/* Favored side */}
            <div
              className="text-xs pt-0.5 pb-0.5"
              style={{ color: favoredColor, fontFamily: 'var(--font-data)', fontSize: '10px' }}
            >
              {favoredLabel}
            </div>
          </div>
        ) : (
          <div className="text-xs pt-1" style={{ color: 'var(--muted)' }}>
            select coins to compare
          </div>
        )}
      </div>
    </div>
  )
}

function CoinSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-0.5">
      <div className="text-xs" style={{ color: 'var(--muted)', fontSize: '10px' }}>{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-xs px-2 py-1 rounded-sm outline-none"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          fontFamily: 'var(--font-data)',
          fontSize: '11px',
        }}
      >
        {options.map((coin) => (
          <option key={coin} value={coin} style={{ background: 'var(--surface-2)' }}>
            {coin}
          </option>
        ))}
      </select>
    </div>
  )
}
