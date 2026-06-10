import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { runFundingAnalysis } from './pipeline'
import { QueryResponse } from './schemas'

export const app = express()

app.use(cors())
app.use(express.json())

const queryCache: QueryResponse[] = []
const MAX_HISTORY = 20

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

app.post('/api/analyze', async (req, res) => {
  const { query } = req.body as { query?: string }
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    res.status(400).json({ error: 'query is required' })
    return
  }

  try {
    const result = await runFundingAnalysis(query.trim())
    queryCache.unshift(result)
    if (queryCache.length > MAX_HISTORY) queryCache.pop()
    res.json(result)
  } catch (err) {
    console.error('[pipeline error]', err)
    res.status(500).json({ error: String(err) })
  }
})

app.get('/api/history', (_req, res) => {
  res.json(queryCache)
})

if (require.main === module) {
  const PORT = process.env.PORT ?? 3001
  app.listen(PORT, () => console.log(`[server] listening on :${PORT}`))
}
