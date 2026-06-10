import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StatusBar } from './components/StatusBar'
import { MetricsBar } from './components/MetricsBar'
import { RatesSidebar } from './components/RatesSidebar'
import { ChatInput } from './components/ChatInput'
import { ChatMessage, StreamingMessage } from './components/ChatMessage'
import { PairsPanel } from './components/PairsPanel'
import { streamQuery, fetchHistory, fetchRates } from './api'
import type { QueryResponse, FundingRate, ToolStep } from './types'

// ── Model options ────────────────────────────────────────────────────────────

const MODELS = [
  { id: 'google/gemma-4-31b-it:free', label: 'gemma', description: 'free' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'llama', description: 'free' },
  { id: 'anthropic/claude-haiku-4.5', label: 'haiku', description: 'fast' },
  { id: 'anthropic/claude-sonnet-4.6', label: 'sonnet', description: 'smart' },
] as const

type ModelId = typeof MODELS[number]['id']

function getStoredModel(): ModelId {
  try {
    const v = localStorage.getItem('hype_monitor_model')
    if (v && MODELS.some((m) => m.id === v)) return v as ModelId
  } catch { /* ignore */ }
  return 'google/gemma-4-31b-it:free'
}

// ── Streaming state ──────────────────────────────────────────────────────────

interface StreamingState {
  query: string
  text: string
  toolSteps: ToolStep[]
}

export default function App() {
  const [history, setHistory] = useState<QueryResponse[]>([])
  const [rates, setRates] = useState<FundingRate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshingRates, setIsRefreshingRates] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastQueryAt, setLastQueryAt] = useState<number | null>(null)
  const [streaming, setStreaming] = useState<StreamingState | null>(null)
  const [selectedModel, setSelectedModel] = useState<ModelId>(getStoredModel)
  const sessionId = useRef<string>(crypto.randomUUID())
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Derive which coins are in the latest response for sidebar highlight
  const activeCoins = history.length > 0
    ? new Set(history[history.length - 1].analyses.map((a) => a.coin))
    : new Set<string>()
  const activeCoin = activeCoins.size === 1 ? [...activeCoins][0] : undefined

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, streaming?.text, streaming?.toolSteps.length])

  // Load session history on mount
  const loadHistory = useCallback(async () => {
    try {
      const h = await fetchHistory()
      setHistory(h)
    } catch { /* silent */ }
  }, [])

  // Fetch live rates — once on mount, then every 30s
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

  const handleModelChange = (id: ModelId) => {
    setSelectedModel(id)
    try { localStorage.setItem('hype_monitor_model', id) } catch { /* ignore */ }
  }

  const handleQuery = async (query: string) => {
    setIsLoading(true)
    setError(null)

    // Initialize streaming state
    setStreaming({ query, text: '', toolSteps: [] })

    // Track tool steps during stream — keyed by tool name so we can update
    // the same step from 'calling' → 'done'
    const toolStepsByName = new Map<string, number>() // name → index in array

    try {
      await streamQuery(
        query,
        sessionId.current,
        selectedModel,
        // onChunk
        (chunk) => {
          setStreaming((prev) =>
            prev ? { ...prev, text: prev.text + chunk } : prev
          )
        },
        // onToolCall
        (step) => {
          setStreaming((prev) => {
            if (!prev) return prev
            const existingIdx = toolStepsByName.get(step.tool)
            if (existingIdx !== undefined) {
              // Update existing step in-place
              const updated = [...prev.toolSteps]
              updated[existingIdx] = step
              return { ...prev, toolSteps: updated }
            } else {
              // New tool step
              const idx = prev.toolSteps.length
              toolStepsByName.set(step.tool, idx)
              return { ...prev, toolSteps: [...prev.toolSteps, step] }
            }
          })
        },
      )

      // Stream finished — reload history to get the canonical response
      setLastQueryAt(Date.now())
      await loadHistory()
      void loadRates()
    } catch (err) {
      setError(String(err))
    } finally {
      setIsLoading(false)
      setStreaming(null)
    }
  }

  const activeModel = MODELS.find((m) => m.id === selectedModel) ?? MODELS[0]

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

        {/* Right side: model selector + meta */}
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
          {/* Model pills */}
          <div className="flex items-center gap-1">
            {MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => handleModelChange(m.id)}
                title={m.description}
                className="px-2 py-0.5 rounded-sm text-xs transition-all"
                style={{
                  fontFamily: 'var(--font-data)',
                  background: m.id === selectedModel ? 'var(--blue)' : 'transparent',
                  color: m.id === selectedModel ? '#fff' : 'var(--muted)',
                  border: `1px solid ${m.id === selectedModel ? 'var(--blue)' : 'var(--border)'}`,
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          <span style={{ color: 'var(--border)' }}>|</span>
          <span style={{ color: 'var(--text-2)' }}>{activeModel.label}</span>
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

        {/* Left: rates sidebar + pairs panel */}
        <div
          className="flex flex-col h-full border-r"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)', width: '220px', flexShrink: 0 }}
        >
          <RatesSidebar
            rates={rates}
            activeCoin={activeCoin}
            isRefreshing={isRefreshingRates}
          />
          <PairsPanel rates={rates} onSubmit={handleQuery} />
        </div>

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
            {history.length === 0 && !isLoading && !streaming && (
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
                <ChatMessage entry={entry} isLatest={i === history.length - 1 && !streaming} />
                {i < history.length - 1 && (
                  <div className="mt-6" style={{ borderBottom: '1px solid var(--border-2)' }} />
                )}
              </div>
            ))}

            {/* Live streaming message */}
            {streaming && (
              <>
                {history.length > 0 && (
                  <div className="mt-6" style={{ borderBottom: '1px solid var(--border-2)' }} />
                )}
                <StreamingMessage
                  query={streaming.query}
                  streamingText={streaming.text}
                  toolSteps={streaming.toolSteps}
                  isStreaming={isLoading}
                />
              </>
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
