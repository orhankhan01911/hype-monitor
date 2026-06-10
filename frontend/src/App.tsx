import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PipelineFlow } from './components/PipelineFlow'
import { MetricsBar } from './components/MetricsBar'
import { ChatInput } from './components/ChatInput'
import { ChatMessage } from './components/ChatMessage'
import { sendQuery, fetchHistory } from './api'
import type { QueryResponse } from './types'

export default function App() {
  const [history, setHistory] = useState<QueryResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeStep, setActiveStep] = useState(-1)
  const [pipelineDone, setPipelineDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Animate pipeline steps while loading
  useEffect(() => {
    if (!isLoading) return
    setPipelineDone(false)
    setActiveStep(0)
    const id = setInterval(() => {
      setActiveStep((s) => (s >= 4 ? s : s + 1))
    }, 700)
    return () => clearInterval(id)
  }, [isLoading])

  // Auto-scroll chat to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const loadHistory = useCallback(async () => {
    try {
      const h = await fetchHistory()
      setHistory(h)
    } catch { /* silent on initial */ }
  }, [])

  useEffect(() => { void loadHistory() }, [loadHistory])

  const handleQuery = async (query: string) => {
    setIsLoading(true)
    setError(null)
    setPipelineDone(false)
    try {
      const result = await sendQuery(query)
      setHistory((prev) => [...prev, result])
      setPipelineDone(true)
    } catch (err) {
      setError(String(err))
    } finally {
      setIsLoading(false)
      setActiveStep(-1)
    }
  }

  return (
    <div className="relative z-10 min-h-screen flex flex-col p-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-start justify-between mb-6 flex-shrink-0"
      >
        <div>
          <h1 className="text-white font-mono text-2xl font-bold tracking-tight leading-none">
            HYPE <span style={{ color: '#00D4FF' }}>MONITOR</span>
          </h1>
          <p className="text-[#8B9EC7] text-xs font-mono mt-1.5">
            Hyperliquid<span className="text-[#00D4FF30] mx-1.5">→</span>
            Vercel AI SDK<span className="text-[#00D4FF30] mx-1.5">→</span>
            OpenRouter<span className="text-[#00D4FF30] mx-1.5">→</span>
            Langfuse
          </p>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#00D4FF' }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-[#8B9EC7]">LIVE · Hyperliquid</span>
        </div>
      </motion.header>

      {/* Pipeline + Metrics */}
      <div className="space-y-3 mb-5 flex-shrink-0">
        <PipelineFlow isActive={isLoading} activeStep={pipelineDone ? 5 : activeStep} />
        <MetricsBar history={history} />
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-3 rounded border border-[#FF4D6D] bg-[#FF4D6D08] text-[#FF4D6D] text-xs font-mono flex-shrink-0"
          >
            ✕ {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat history */}
      <div className="flex-1 overflow-y-auto mb-4 min-h-0 space-y-6">
        {history.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center justify-center h-full py-16 text-center"
          >
            <div className="text-[#1e2736] text-5xl mb-4 font-mono">◈</div>
            <p className="text-[#8B9EC7] text-sm font-mono mb-2">Ask anything about Hyperliquid funding rates</p>
            <div className="space-y-1 mt-4">
              {[
                '"show me HYPE funding rate"',
                '"compare BTC vs ETH funding"',
                '"which perp has the highest funding?"',
              ].map((s) => (
                <p key={s} className="text-[#2d3a4a] text-xs font-mono">{s}</p>
              ))}
            </div>
          </motion.div>
        )}

        {history.map((entry, i) => (
          <ChatMessage
            key={entry.trace.traceId}
            entry={entry}
            isLatest={i === history.length - 1}
          />
        ))}

        {/* Loading state */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 items-center"
          >
            <div
              className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-mono"
              style={{ background: '#00D4FF15', color: '#00D4FF', border: '1px solid #00D4FF30' }}
            >
              AI
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: '#00D4FF' }}
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Chat input — pinned to bottom */}
      <div className="flex-shrink-0">
        <ChatInput onSubmit={handleQuery} isLoading={isLoading} />
      </div>
    </div>
  )
}
