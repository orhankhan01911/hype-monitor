import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StatusBar } from './components/StatusBar'
import { MetricsBar } from './components/MetricsBar'
import { ChatInput } from './components/ChatInput'
import { ChatMessage } from './components/ChatMessage'
import { sendQuery, fetchHistory } from './api'
import type { QueryResponse } from './types'

export default function App() {
  const [history, setHistory] = useState<QueryResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastQueryAt, setLastQueryAt] = useState<number | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const loadHistory = useCallback(async () => {
    try {
      const h = await fetchHistory()
      setHistory(h)
    } catch { /* silent */ }
  }, [])

  useEffect(() => { void loadHistory() }, [loadHistory])

  const handleQuery = async (query: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await sendQuery(query)
      setHistory((prev) => [...prev, result])
      setLastQueryAt(Date.now())
    } catch (err) {
      setError(String(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-6">
          <h1 className="text-sm font-bold tracking-wide">
            HYPE <span style={{ color: 'var(--cyan)' }}>MONITOR</span>
          </h1>
          <span className="text-xs" style={{ color: 'var(--label)' }}>
            funding rate intelligence
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--label)' }}>
          <span>Hyperliquid perps</span>
          <span>·</span>
          <span>Claude 3 Haiku via OpenRouter</span>
        </div>
      </div>

      {/* Status row */}
      <StatusBar
        isLoading={isLoading}
        lastQueryAt={lastQueryAt}
        queryCount={history.length}
      />

      {/* Metrics strip (only when there's data) */}
      <MetricsBar history={history} />

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 py-2 text-xs border-b flex-shrink-0"
            style={{ borderColor: '#ff4d6d40', background: '#ff4d6d08', color: '#ff4d6d' }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat history */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 min-h-0">
        {history.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="pt-8"
          >
            <p className="text-sm mb-4" style={{ color: 'var(--label)' }}>
              Ask about any Hyperliquid perpetual.
            </p>
            <div className="space-y-1">
              {[
                '> show me HYPE funding rate',
                '> compare BTC vs ETH funding',
                '> which perp has the highest funding?',
                '> is SOL overextended?',
              ].map((s) => (
                <p key={s} className="text-xs" style={{ color: 'var(--border)' }}>{s}</p>
              ))}
            </div>
          </motion.div>
        )}

        {history.map((entry, i) => (
          <div key={entry.trace.traceId}>
            <ChatMessage entry={entry} isLatest={i === history.length - 1} />
            {i < history.length - 1 && (
              <div className="mt-6 border-b" style={{ borderColor: 'var(--border)' }} />
            )}
          </div>
        ))}

        {/* Loading indicator — no bouncing dots */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 text-xs"
            style={{ color: 'var(--label)' }}
          >
            <motion.span
              style={{ color: 'var(--cyan)' }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              _
            </motion.span>
            <span>fetching live data and analyzing…</span>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="px-5 pb-4 flex-shrink-0">
        <ChatInput onSubmit={handleQuery} isLoading={isLoading} />
      </div>
    </div>
  )
}
