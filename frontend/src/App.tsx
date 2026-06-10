import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StatusBar } from './components/StatusBar'
import { MetricsBar } from './components/MetricsBar'
import { RatesSidebar } from './components/RatesSidebar'
import { ChatInput } from './components/ChatInput'
import { ChatMessage } from './components/ChatMessage'
import { sendQuery, fetchHistory, fetchRates } from './api'
import type { QueryResponse, FundingRate } from './types'

export default function App() {
  const [history, setHistory] = useState<QueryResponse[]>([])
  const [rates, setRates] = useState<FundingRate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshingRates, setIsRefreshingRates] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastQueryAt, setLastQueryAt] = useState<number | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Derive which coins are in the latest response for sidebar highlight
  const activeCoins = history.length > 0
    ? new Set(history[history.length - 1].analyses.map((a) => a.coin))
    : new Set<string>()
  const activeCoin = activeCoins.size === 1 ? [...activeCoins][0] : undefined

  // Auto-scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  // Load session history on mount
  const loadHistory = useCallback(async () => {
    try {
      const h = await fetchHistory()
      setHistory(h)
    } catch { /* silent */ }
  }, [])

  // Fetch live rates — runs once on mount, then every 30s
  const loadRates = useCallback(async () => {
    setIsRefreshingRates(true)
    try {
      const r = await fetchRates()
      setRates(r)
    } catch { /* silent */ } finally {
      setIsRefreshingRates(false)
    }
  }, [])

  useEffect(() => {
    void loadHistory()
    void loadRates()
    const id = setInterval(() => void loadRates(), 30_000)
    return () => clearInterval(id)
  }, [loadHistory, loadRates])

  const handleQuery = async (query: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await sendQuery(query)
      setHistory((prev) => [...prev, result])
      setLastQueryAt(Date.now())
      // Refresh sidebar rates after a query
      void loadRates()
    } catch (err) {
      setError(String(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">

      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 py-2.5 border-b flex-shrink-0"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <div className="flex items-center gap-5">
          <h1
            className="text-sm font-semibold tracking-wider"
            style={{ fontFamily: 'var(--font-data)', letterSpacing: '0.08em' }}
          >
            HYPE MONITOR
          </h1>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            Hyperliquid Perpetuals · AI Funding Analysis
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--muted)' }}>
          <span>claude-3-haiku</span>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span>via OpenRouter</span>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span>Langfuse</span>
        </div>
      </div>

      {/* Status row */}
      <StatusBar
        isLoading={isLoading}
        lastQueryAt={lastQueryAt}
        queryCount={history.length}
      />

      {/* Metrics strip */}
      <MetricsBar history={history} />

      {/* Body: sidebar + chat */}
      <div className="flex flex-1 min-h-0">

        {/* Left: rates sidebar */}
        <RatesSidebar
          rates={rates}
          activeCoin={activeCoin}
          isRefreshing={isRefreshingRates}
        />

        {/* Right: chat area */}
        <div className="flex flex-col flex-1 min-w-0">

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-5 py-2 text-xs border-b flex-shrink-0"
                style={{
                  borderColor: '#f6465d40',
                  background: '#f6465d08',
                  color: 'var(--red)',
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat history */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 min-h-0">
            {history.length === 0 && !isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="pt-6 space-y-4"
              >
                <p
                  className="text-sm"
                  style={{ color: 'var(--text-2)', fontFamily: 'var(--font-prose)' }}
                >
                  Ask about any Hyperliquid perpetual. Live rates are in the sidebar.
                </p>
                <div className="space-y-1.5">
                  {[
                    'show me HYPE funding rate',
                    'compare BTC vs ETH funding',
                    'which perp has the highest funding?',
                    'is SOL overextended?',
                  ].map((s) => (
                    <p key={s} className="text-xs" style={{ color: 'var(--muted)' }}>
                      › {s}
                    </p>
                  ))}
                </div>
              </motion.div>
            )}

            {history.map((entry, i) => (
              <div key={entry.trace.traceId}>
                <ChatMessage entry={entry} isLatest={i === history.length - 1} />
                {i < history.length - 1 && (
                  <div className="mt-6" style={{ borderBottom: '1px solid var(--border-2)' }} />
                )}
              </div>
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-xs"
                style={{ color: 'var(--muted)' }}
              >
                <motion.span
                  style={{ color: 'var(--blue)' }}
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                >
                  _
                </motion.span>
                <span>fetching live rates and analyzing…</span>
              </motion.div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="px-5 pb-4 flex-shrink-0">
            <ChatInput onSubmit={handleQuery} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  )
}
