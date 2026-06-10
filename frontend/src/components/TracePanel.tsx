import { motion, AnimatePresence } from 'framer-motion'
import type { APIResponse } from '../types'

interface Props {
  traces: APIResponse[]
}

const SENTIMENT_COLOR = {
  bullish: '#00D4FF',
  bearish: '#FF4D6D',
  neutral: '#8B9EC7',
}

export function TracePanel({ traces }: Props) {
  return (
    <div className="p-5 bg-[#0d1117] rounded-lg border border-[#1e2736] h-[280px] flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <p className="text-[#8B9EC7] text-xs font-mono tracking-widest uppercase">
          Langfuse Trace Log
        </p>
        <span className="text-[#00D4FF] text-xs font-mono">{traces.length} runs</span>
      </div>

      <div className="overflow-y-auto flex-1 space-y-2 pr-0.5">
        <AnimatePresence initial={false}>
          {traces.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-[#8B9EC7] text-xs font-mono text-center">
                No traces yet<br />
                <span className="opacity-60">Click ▶ ANALYZE to start</span>
              </p>
            </div>
          ) : (
            traces.map((t) => (
              <motion.div
                key={t.trace.traceId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
                className="bg-[#161b22] rounded border border-[#1e2736] p-2.5"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[#00D4FF] text-[10px] font-mono truncate max-w-[140px]">
                    {t.trace.traceId.slice(0, 14)}…
                  </span>
                  <span className="text-[#8B9EC7] text-[10px] font-mono flex-shrink-0">
                    {t.trace.latencyMs}ms
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      color: SENTIMENT_COLOR[t.analysis.sentiment],
                      background: `${SENTIMENT_COLOR[t.analysis.sentiment]}15`,
                    }}
                  >
                    {t.analysis.sentiment}
                  </span>
                  <span className="text-[#8B9EC7] text-[10px] font-mono">
                    {t.trace.inputTokens + t.trace.outputTokens} tok
                  </span>
                  <span className="text-[#8B9EC7] text-[10px] font-mono">
                    {t.trace.model.split('/').pop()}
                  </span>
                  {t.trace.langfuseUrl && (
                    <a
                      href={t.trace.langfuseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono text-[#00D4FF] hover:underline ml-auto"
                    >
                      ↗ Langfuse
                    </a>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
