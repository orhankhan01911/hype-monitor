import { motion } from 'framer-motion'
import { FundingCard } from './FundingCard'
import type { QueryResponse } from '../types'

interface Props {
  entry: QueryResponse
  isLatest: boolean
}

export function ChatMessage({ entry, isLatest }: Props) {
  const time = new Date(entry.trace.timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <motion.div
      initial={isLatest ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Query row */}
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-xs flex-shrink-0" style={{ color: 'var(--muted)' }}>{time}</span>
        <span className="text-xs" style={{ color: 'var(--label)' }}>›</span>
        <span className="text-sm" style={{ color: 'var(--text)' }}>{entry.userQuery}</span>
      </div>

      {/* Response */}
      <div className="ml-[72px] space-y-3">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--body)' }}>
          {entry.aiResponse}
        </p>

        {/* Funding cards */}
        {entry.analyses.length > 0 && (
          <div className={`grid gap-2 ${entry.analyses.length > 1 ? 'grid-cols-2' : 'grid-cols-1 max-w-xs'}`}>
            {entry.analyses.map((a) => (
              <FundingCard key={a.coin} analysis={a} compact />
            ))}
          </div>
        )}

        {/* Trace metadata */}
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
          <span>{entry.trace.latencyMs}ms</span>
          <span>·</span>
          <span>{(entry.trace.inputTokens + entry.trace.outputTokens).toLocaleString()} tok</span>
          <span>·</span>
          <span>{entry.trace.model.split('/').pop()}</span>
          {entry.trace.langfuseUrl && (
            <>
              <span>·</span>
              <a
                href={entry.trace.langfuseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cyan)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
              >
                trace ↗
              </a>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
