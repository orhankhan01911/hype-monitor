import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

interface Props {
  onSubmit: (query: string) => void
  isLoading: boolean
}

const SUGGESTIONS = [
  'show me HYPE funding rate',
  'compare BTC vs ETH funding',
  'which perp has the highest funding?',
  'is SOL funding bullish or bearish?',
  'top 3 coins with extreme funding rates',
]

export function ChatInput({ onSubmit, isLoading }: Props) {
  const [value, setValue] = useState('')
  const [suggestionIdx, setSuggestionIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Rotate placeholder suggestions
  useEffect(() => {
    const id = setInterval(() => setSuggestionIdx((i) => (i + 1) % SUGGESTIONS.length), 3500)
    return () => clearInterval(id)
  }, [])

  const handleSubmit = () => {
    const q = value.trim()
    if (!q || isLoading) return
    onSubmit(q)
    setValue('')
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="relative">
      {/* Terminal prompt line */}
      <div
        className="flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-200"
        style={{
          borderColor: isLoading ? '#00D4FF60' : value ? '#00D4FF' : '#1e2736',
          background: '#0d1117',
          boxShadow: value && !isLoading ? '0 0 20px #00D4FF10' : 'none',
        }}
      >
        {/* Prompt symbol */}
        <span className="font-mono text-sm flex-shrink-0" style={{ color: '#00D4FF' }}>
          {isLoading ? (
            <motion.span
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              ◈
            </motion.span>
          ) : (
            '▸'
          )}
        </span>

        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          disabled={isLoading}
          placeholder={SUGGESTIONS[suggestionIdx]}
          className="flex-1 bg-transparent outline-none font-mono text-sm text-white placeholder-[#2d3a4a] disabled:opacity-50"
          autoFocus
        />

        {/* Token hint */}
        {value.length > 0 && (
          <span className="text-[#8B9EC7] text-[10px] font-mono flex-shrink-0">
            {value.length} chars
          </span>
        )}

        {/* Send button */}
        <motion.button
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading}
          whileHover={value.trim() && !isLoading ? { scale: 1.05 } : undefined}
          whileTap={value.trim() && !isLoading ? { scale: 0.95 } : undefined}
          className="flex-shrink-0 px-3 py-1 rounded font-mono text-xs font-semibold transition-all disabled:opacity-30"
          style={{
            background: value.trim() && !isLoading ? '#00D4FF' : 'transparent',
            color: value.trim() && !isLoading ? '#080c10' : '#00D4FF',
            border: '1px solid #00D4FF',
          }}
        >
          {isLoading ? '…' : 'SEND'}
        </motion.button>
      </div>

      {/* Hint row */}
      <p className="text-[#2d3a4a] text-[10px] font-mono mt-1.5 ml-1">
        Ask about any Hyperliquid perp · Press Enter to send
      </p>
    </div>
  )
}
