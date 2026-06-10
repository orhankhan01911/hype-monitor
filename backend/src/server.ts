import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { runFundingAnalysis } from './pipeline'
import { APIResponse } from './schemas'

export const app = express()

app.use(cors())
app.use(express.json())

const traceCache: APIResponse[] = []
const MAX_TRACES = 20

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

app.get('/api/analyze', async (_req, res) => {
  try {
    const result = await runFundingAnalysis()
    traceCache.unshift(result)
    if (traceCache.length > MAX_TRACES) traceCache.pop()
    res.json(result)
  } catch (err) {
    console.error('[pipeline error]', err)
    res.status(500).json({ error: String(err) })
  }
})

app.get('/api/traces', (_req, res) => {
  res.json(traceCache)
})

if (require.main === module) {
  const PORT = process.env.PORT ?? 3001
  app.listen(PORT, () => console.log(`[server] listening on :${PORT}`))
}
