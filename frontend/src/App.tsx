import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FundingCard } from './components/FundingCard'
import { PipelineFlow } from './components/PipelineFlow'
import { TracePanel } from './components/TracePanel'
import { MetricsBar } from './components/MetricsBar'
import { triggerAnalysis, fetchTraces } from './api'
import type { APIResponse } from './types'

export default function App() {
  const [latest, setLatest] = useState<APIResponse | null>(null)
  const [traces, setTraces] = useState<APIResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeStep, setActiveStep] = useState(-1)
  const [error, setError] = useState<string | null>(null)
  const [pipelineDone, setPipelineDone] = useState(false)

  useEffect(() => {
    if (!isLoading) return
    setPipelineDone(false)
    setActiveStep(0)
    const id = setInterval(() => {
      setActiveStep(s => {
        if (s >= 4) { clearInterval(id); return s }
        return s + 1
      })
    }, 700)
    return () => clearInterval(id)
  }, [isLoading])

  const loadTraces = useCallback(async () => {
    try {
      const t = await fetchTraces()
      setTraces(t)
    } catch { /* silent on initial load */ }
  }, [])

  useEffect(() => { void loadTraces() }, [loadTraces])

  const handleAnalyze = async () => {
    if (isLoading) return
    setIsLoading(true)
    setError(null)
    setPipelineDone(false)
    try {
      const result = await triggerAnalysis()
      setLatest(result)
      setTraces(prev => [result, ...prev].slice(0, 20))
      setPipelineDone(true)
    } catch (err) {
      setError(String(err))
    } finally {
      setIsLoading(false)
      setActiveStep(-1)
    }
  }

  return (
    <div className="relative z-10 min-h-screen p-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-start justify-between mb-8"
      >
        <div>
          <h1 className="text-white font-mono text-2xl font-bold tracking-tight leading-none">
            HYPE <span style={{ color: '#00D4FF' }}>MONITOR</span>
          </h1>
          <p className="text-[#8B9EC7] text-xs font-mono mt-1.5 leading-relaxed">
            Funding Pipeline Tracer<span className="text-[#1e2736] mx-1.5">·</span>
            Hyperliquid<span className="text-[#00D4FF30] mx-1">→</span>
            Vercel AI SDK<span className="text-[#00D4FF30] mx-1">→</span>
            OpenRouter<span className="text-[#00D4FF30] mx-1">→</span>
            Langfuse
          </p>
        </div>

        <motion.button
          onClick={handleAnalyze}
          disabled={isLoading}
          whileHover={!isLoading ? { scale: 1.02 } : undefined}
          whileTap={!isLoading ? { scale: 0.97 } : undefined}
          className="relative px-6 py-2.5 rounded font-mono text-sm font-semibold overflow-hidden transition-colors disabled:cursor-not-allowed"
          style={{
            background: isLoading ? 'transparent' : '#00D4FF',
            color: isLoading ? '#00D4FF' : '#080c10',
            border: '1.5px solid #00D4FF',
          }}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 0.7, repeat: Infinity }}
              >
                ◈
              </motion.span>
              ANALYZING…
            </span>
          ) : (
            '▶ ANALYZE'
          )}
        </motion.button>
      </motion.header>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="p-3 rounded border border-[#FF4D6D] bg-[#FF4D6D08] text-[#FF4D6D] text-xs font-mono overflow-hidden"
          >
            ✕ {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pipeline visualization */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="mb-4"
      >
        <PipelineFlow
          isActive={isLoading}
          activeStep={pipelineDone ? 5 : activeStep}
        />
      </motion.div>

      {/* Metrics row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="mb-4"
      >
        <MetricsBar traces={traces} />
      </motion.div>

      {/* Main two-column grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left: analysis result */}
        <div>
          <AnimatePresence mode="wait">
            {latest ? (
              <FundingCard
                key={latest.trace.traceId}
                analysis={latest.analysis}
                isLoading={isLoading}
              />
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[220px] bg-[#0d1117] rounded-lg border border-[#1e2736] flex flex-col items-center justify-center gap-2"
              >
                <span className="text-[#1e2736] text-3xl">◈</span>
                <p className="text-[#8B9EC7] text-xs font-mono">
                  Click ▶ ANALYZE to fetch live HYPE funding data
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: trace log */}
        <TracePanel traces={traces} />
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <p className="text-[#1e2736] text-[10px] font-mono">
          Data: Hyperliquid public API · Models: via OpenRouter · Observability: Langfuse
        </p>
      </motion.footer>
    </div>
  )
}
