import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  isLoading: boolean
  lastQueryAt: number | null
  queryCount: number
}

const STEPS = ['Hyperliquid', 'AI SDK', 'OpenRouter', 'LLM', 'Langfuse']

export function StatusBar({ isLoading, lastQueryAt, queryCount }: Props) {
  const lastTime = lastQueryAt
    ? new Date(lastQueryAt).toLocaleTimeString('en-US', { hour12: false })
    : null

  return (
    <div
      className="flex items-center justify-between px-4 py-2 border-b text-xs"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: isLoading ? 'var(--yellow)' : 'var(--green)' }}
            animate={isLoading ? { opacity: [1, 0.3, 1] } : {}}
            transition={{ duration: 0.6, repeat: isLoading ? Infinity : 0 }}
          />
          <span style={{ color: isLoading ? 'var(--yellow)' : 'var(--muted)' }}>
            {isLoading ? 'processing' : 'connected'}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="steps"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1"
              style={{ color: 'var(--muted)' }}
            >
              {STEPS.map((s, i) => (
                <span key={s} className="flex items-center gap-1">
                  <motion.span
                    animate={{ color: ['var(--muted)', 'var(--text-2)', 'var(--muted)'] }}
                    transition={{ duration: 1.8, delay: i * 0.35, repeat: Infinity }}
                  >
                    {s}
                  </motion.span>
                  {i < STEPS.length - 1 && <span style={{ color: 'var(--border)' }}>›</span>}
                </span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4" style={{ color: 'var(--muted)' }}>
        {lastTime && <span>last query {lastTime}</span>}
        {queryCount > 0 && <span>{queryCount} {queryCount === 1 ? 'query' : 'queries'} this session</span>}
      </div>
    </div>
  )
}
