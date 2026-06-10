import { motion } from 'framer-motion'
import { CoinTable } from './CoinTable'
import type { QueryResponse } from '../types'

interface Props {
  entry: QueryResponse
  isLatest: boolean
}

export function ChatMessage({ entry, isLatest }: Props) {
  const time = new Date(entry.trace.timestamp).toLocaleTimeString('en-US', {
    hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  return (
    <motion.div
      initial={isLatest ? { opacity: 0, y: 6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      {/* Query line */}
      <div className="flex items-baseline gap-3">
        <span className="text-xs tabular-nums flex-shrink-0" style={{ color: 'var(--muted)' }}>
          {time}
        </span>
        <span className="text-xs flex-shrink-0" style={{ color: 'var(--blue)' }}>›</span>
        <span className="text-sm" style={{ color: 'var(--text)' }}>{entry.userQuery}</span>
      </div>

      {/* Response block */}
      <div className="pl-[88px] space-y-3">
        {/* AI prose — IBM Plex Sans for readability */}
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--text-2)', fontFamily: 'var(--font-prose)' }}
        >
          {entry.aiResponse}
        </p>

        {/* Data table — replaces cards */}
        <CoinTable analyses={entry.analyses} />

        {/* Trace metadata */}
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
          <span>{entry.trace.latencyMs}ms</span>
          <span>·</span>
          <span>{(entry.trace.inputTokens + entry.trace.outputTokens).toLocaleString()} tok</span>
          <span>·</span>
          <span style={{ color: 'var(--muted)' }}>{entry.trace.model.split('/').pop()}</span>
          {entry.trace.langfuseUrl && (
            <>
              <span>·</span>
              <a
                href={entry.trace.langfuseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--blue)')}
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
