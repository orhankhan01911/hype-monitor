// Mock out the full pipeline so Langfuse's dynamic-import doesn't break Jest
jest.mock('./pipeline', () => ({
  runFundingAnalysis: jest.fn().mockResolvedValue({
    analysis: {
      coin: 'HYPE',
      fundingRate: 0.0001,
      sentiment: 'bullish',
      confidence: 0.9,
      summary: 'Test summary.',
      recommendation: 'long',
      riskLevel: 'medium',
      timestamp: Date.now(),
    },
    trace: {
      traceId: 'test-trace-id',
      coin: 'HYPE',
      model: 'anthropic/claude-3-haiku',
      inputTokens: 100,
      outputTokens: 50,
      latencyMs: 1200,
      timestamp: Date.now(),
    },
  }),
}))

import request from 'supertest'
import { app } from './server'

test('GET /api/health returns 200 with ok status', async () => {
  const res = await request(app).get('/api/health')
  expect(res.status).toBe(200)
  expect(res.body.status).toBe('ok')
  expect(typeof res.body.timestamp).toBe('number')
})

test('GET /api/traces returns empty array initially', async () => {
  const res = await request(app).get('/api/traces')
  expect(res.status).toBe(200)
  expect(Array.isArray(res.body)).toBe(true)
})

test('GET /api/analyze calls pipeline and returns result', async () => {
  const res = await request(app).get('/api/analyze')
  expect(res.status).toBe(200)
  expect(res.body.analysis.coin).toBe('HYPE')
  expect(res.body.trace.traceId).toBe('test-trace-id')
})
