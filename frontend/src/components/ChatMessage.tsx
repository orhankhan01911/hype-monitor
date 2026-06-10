import { motion } from 'framer-motion'
import { CoinTable } from './CoinTable'
import type { QueryResponse, ToolStep } from '../types'

// ── Completed message from history ─────────────────────────────────────────

interface HistoryProps {
  entry: QueryResponse
  isLatest: boolean
}

export function ChatMessage({ entry, isLatest }: HistoryProps) {
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
        {/* AI prose */}
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--text-2)', fontFamily: 'var(--font-prose)' }}
        >
          {entry.aiResponse}
        </p>

        {/* Data table */}
        <CoinTable analyses={entry.analyses} />

        {/* Trace metadata */}
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
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

// ── Live streaming message ──────────────────────────────────────────────────

interface StreamingProps {
  query: string
  streamingText: string
  toolSteps: ToolStep[]
  isStreaming: boolean
}

export function StreamingMessage({ query, streamingText, toolSteps, isStreaming }: StreamingProps) {
  const now = new Date().toLocaleTimeString('en-US', {
    hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      {/* Query line */}
      <div className="flex items-baseline gap-3">
        <span className="text-xs tabular-nums flex-shrink-0" style={{ color: 'var(--muted)' }}>
          {now}
        </span>
        <span className="text-xs flex-shrink-0" style={{ color: 'var(--blue)' }}>›</span>
        <span className="text-sm" style={{ color: 'var(--text)' }}>{query}</span>
      </div>

      {/* Response block */}
      <div className="pl-[88px] space-y-2">

        {/* Tool steps */}
        {toolSteps.length > 0 && (
          <div className="space-y-0.5 mb-2">
            {toolSteps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2 text-xs"
                style={{
                  fontFamily: 'var(--font-data)',
                  color: step.status === 'done' ? 'var(--muted)' : 'var(--text-2)',
                }}
              >
                <span style={{ color: step.status === 'done' ? 'var(--green)' : 'var(--yellow)' }}>
                  {step.status === 'done' ? '✓' : '›'}
                </span>
                <span>{step.summary}</span>
                {step.status === 'calling' && (
                  <motion.span
                    style={{ color: 'var(--yellow)' }}
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 0.7, repeat: Infinity }}
                  >
                    _
                  </motion.span>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Streaming text */}
        {(streamingText || isStreaming) && (
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--text-2)', fontFamily: 'var(--font-prose)' }}
          >
            {streamingText}
            {isStreaming && (
              <motion.span
                className="inline-block ml-0.5 font-mono"
                style={{ color: 'var(--blue)' }}
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                _
              </motion.span>
            )}
          </p>
        )}

        {/* Waiting for first token */}
        {!streamingText && !toolSteps.length && isStreaming && (
          <motion.div
            className="flex items-center gap-2 text-xs"
            style={{ color: 'var(--muted)' }}
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.1, repeat: Infinity }}
          >
            <span style={{ color: 'var(--blue)' }}>_</span>
            <span>thinking…</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
