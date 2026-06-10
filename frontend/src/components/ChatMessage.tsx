import { motion } from 'framer-motion'
import { FundingCard } from './FundingCard'
import type { QueryResponse } from '../types'

interface Props {
  entry: QueryResponse
  isLatest: boolean
}

export function ChatMessage({ entry, isLatest }: Props) {
  return (
    <motion.div
      initial={isLatest ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-3"
    >
      {/* User query bubble */}
      <div className="flex justify-end">
        <div
          className="max-w-[80%] px-4 py-2 rounded-lg rounded-br-sm font-mono text-sm"
          style={{
            background: '#00D4FF15',
            border: '1px solid #00D4FF30',
            color: '#00D4FF',
          }}
        >
          {entry.userQuery}
        </div>
      </div>

      {/* AI response */}
      <div className="flex gap-3 items-start">
        <div
          className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-mono mt-0.5"
          style={{ background: '#00D4FF15', color: '#00D4FF', border: '1px solid #00D4FF30' }}
        >
          AI
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          {/* Natural language response */}
          <p className="text-[#C8D6EF] text-sm font-sans leading-relaxed">
            {entry.aiResponse}
          </p>

          {/* Funding cards for focused coins */}
          <div className={`grid gap-3 ${entry.analyses.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {entry.analyses.map((analysis) => (
              <FundingCard key={analysis.coin} analysis={analysis} isLoading={false} compact />
            ))}
          </div>

          {/* Trace metadata */}
          <div className="flex items-center gap-3 text-[10px] font-mono text-[#2d3a4a]">
            <span>{entry.trace.latencyMs}ms</span>
            <span>·</span>
            <span>{entry.trace.inputTokens + entry.trace.outputTokens} tokens</span>
            <span>·</span>
            {entry.trace.langfuseUrl ? (
              <a
                href={entry.trace.langfuseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#00D4FF] transition-colors"
              >
                ↗ trace
              </a>
            ) : (
              <span>{entry.trace.traceId.slice(0, 12)}…</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
