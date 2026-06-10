import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

interface Props {
  onSubmit: (query: string) => void
  isLoading: boolean
}

const PLACEHOLDERS = [
  'show me HYPE funding rate',
  'compare BTC vs ETH funding',
  'which perp has the highest funding?',
  'is SOL overextended long?',
  'top coins with extreme funding',
]

export function ChatInput({ onSubmit, isLoading }: Props) {
  const [value, setValue] = useState('')
  const [phIdx, setPhIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = setInterval(() => setPhIdx((i) => (i + 1) % PLACEHOLDERS.length), 4000)
    return () => clearInterval(id)
  }, [])

  const submit = () => {
    const q = value.trim()
    if (!q || isLoading) return
    onSubmit(q)
    setValue('')
  }

  return (
    <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
      <div
        className="flex items-center gap-3 rounded border px-4 py-2.5 transition-colors"
        style={{
          borderColor: value ? '#00D4FF40' : 'var(--border)',
          background: 'var(--surface)',
        }}
      >
        {/* Cursor */}
        <motion.span
          className="flex-shrink-0 text-sm"
          style={{ color: isLoading ? '#f59e0b' : 'var(--cyan)' }}
          animate={isLoading ? { opacity: [1, 0.2, 1] } : { opacity: 1 }}
          transition={{ duration: 0.7, repeat: isLoading ? Infinity : 0 }}
        >
          {isLoading ? '…' : '>'}
        </motion.span>

        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          disabled={isLoading}
          placeholder={PLACEHOLDERS[phIdx]}
          className="flex-1 bg-transparent outline-none text-sm disabled:opacity-40"
          style={{ color: 'var(--text)', caretColor: 'var(--cyan)' }}
          autoFocus
        />

        <button
          onClick={submit}
          disabled={!value.trim() || isLoading}
          className="flex-shrink-0 text-xs px-3 py-1 rounded-sm transition-all disabled:opacity-30"
          style={{
            background: value.trim() && !isLoading ? 'var(--cyan)' : 'transparent',
            color: value.trim() && !isLoading ? '#080c10' : 'var(--label)',
            border: '1px solid var(--border)',
          }}
        >
          run
        </button>
      </div>
      <p className="text-xs mt-1.5 px-1" style={{ color: 'var(--muted)' }}>
        Enter to send · asks about any Hyperliquid perpetual
      </p>
    </div>
  )
}
