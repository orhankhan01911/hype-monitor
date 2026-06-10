import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { runFundingAnalysis, runFundingAnalysisSync } from './pipeline'
import { fetchTopFundingRates } from './hyperliquid'
import { FundingRate, QueryResponse } from './schemas'

// --- Startup env validation -------------------------------------------------
const EnvSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1, 'OPENROUTER_API_KEY is required'),
  LANGFUSE_PUBLIC_KEY: z.string().min(1, 'LANGFUSE_PUBLIC_KEY is required'),
  LANGFUSE_SECRET_KEY: z.string().min(1, 'LANGFUSE_SECRET_KEY is required'),
})

const env = EnvSchema.safeParse(process.env)
if (!env.success) {
  const missing = env.error.issues.map((i) => `  - ${i.message}`).join('\n')
  throw new Error(
    `[server] Invalid environment. Fix your .env (see .env.example):\n${missing}`
  )
}

export const app = express()

app.use(cors())
app.use(express.json())

const queryCache: QueryResponse[] = []
const MAX_HISTORY = 20

// --- /api/rates 5s cache ----------------------------------------------------
const RATES_CACHE_TTL_MS = 5_000
let ratesCache: { data: FundingRate[]; timestamp: number } | null = null

// --- Rate limiter for the expensive LLM endpoint ----------------------------
const chatLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

/**
 * Streaming chat endpoint. POST { query, sessionId? } -> SSE-style data stream.
 */
app.post('/api/chat', chatLimiter, async (req, res) => {
  const { query, sessionId, modelId } = req.body as {
    query?: string
    sessionId?: string
    modelId?: string
  }
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    res.status(400).json({ error: 'query is required' })
    return
  }

  const sid =
    typeof sessionId === 'string' && sessionId.trim().length > 0
      ? sessionId.trim()
      : randomUUID()

  try {
    const { result, traceId } = await runFundingAnalysis(query.trim(), sid, modelId)

    // Surface session + trace ids to the client before the body streams.
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('X-Accel-Buffering', 'no')
    res.setHeader('X-Session-Id', sid)
    res.setHeader('X-Trace-Id', traceId)

    // Pipe the AI SDK data stream straight to the response.
    result.pipeDataStreamToResponse(res)
  } catch (err) {
    console.error('[chat error]', err)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Analysis failed. Please try again.' })
    } else {
      res.end()
    }
  }
})

/**
 * Backwards-compatible non-streaming endpoint. Returns a full QueryResponse and
 * records it in the in-memory history.
 */
app.post('/api/analyze', async (req, res) => {
  const { query, sessionId } = req.body as {
    query?: string
    sessionId?: string
  }
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    res.status(400).json({ error: 'query is required' })
    return
  }

  const sid =
    typeof sessionId === 'string' && sessionId.trim().length > 0
      ? sessionId.trim()
      : randomUUID()

  try {
    const result = await runFundingAnalysisSync(query.trim(), sid)
    queryCache.unshift(result)
    if (queryCache.length > MAX_HISTORY) queryCache.pop()
    res.json(result)
  } catch (err) {
    console.error('[analyze error]', err)
    res.status(500).json({ error: 'Analysis failed. Please try again.' })
  }
})

app.get('/api/rates', async (_req, res) => {
  try {
    const now = Date.now()
    if (!ratesCache || now - ratesCache.timestamp > RATES_CACHE_TTL_MS) {
      const data = await fetchTopFundingRates(20)
      ratesCache = { data, timestamp: now }
    }
    res.json(ratesCache.data)
  } catch (err) {
    console.error('[rates error]', err)
    res.status(500).json({ error: 'Failed to fetch funding rates.' })
  }
})

app.get('/api/history', (_req, res) => {
  res.json(queryCache)
})

if (require.main === module) {
  const PORT = process.env.PORT ?? 3001
  app.listen(PORT, () => console.log(`[server] listening on :${PORT}`))
}
