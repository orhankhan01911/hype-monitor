jest.mock('./pipeline', () => ({
  runFundingAnalysis: jest.fn().mockResolvedValue({
    userQuery: 'show me HYPE funding rate',
    aiResponse: 'HYPE has a positive funding rate of 0.0013%/8h indicating a bullish market.',
    analyses: [{
      coin: 'HYPE',
      fundingRate: 0.0000125,
      sentiment: 'bullish',
      confidence: 0.85,
      summary: 'Positive funding indicates overextended longs.',
      recommendation: 'wait',
      riskLevel: 'medium',
      timestamp: Date.now(),
    }],
    trace: {
      traceId: 'test-trace-id',
      model: 'anthropic/claude-3-haiku',
      inputTokens: 200,
      outputTokens: 80,
      latencyMs: 1400,
      timestamp: Date.now(),
    },
  }),
}))

import request from 'supertest'
import { app } from './server'

test('GET /api/health returns 200', async () => {
  const res = await request(app).get('/api/health')
  expect(res.status).toBe(200)
  expect(res.body.status).toBe('ok')
})

test('GET /api/history returns empty array initially', async () => {
  const res = await request(app).get('/api/history')
  expect(res.status).toBe(200)
  expect(Array.isArray(res.body)).toBe(true)
})

test('POST /api/analyze without query returns 400', async () => {
  const res = await request(app).post('/api/analyze').send({})
  expect(res.status).toBe(400)
})

test('POST /api/analyze with query calls pipeline and returns result', async () => {
  const res = await request(app)
    .post('/api/analyze')
    .send({ query: 'show me HYPE funding rate' })
  expect(res.status).toBe(200)
  expect(res.body.userQuery).toBe('show me HYPE funding rate')
  expect(res.body.analyses[0].coin).toBe('HYPE')
  expect(res.body.trace.traceId).toBe('test-trace-id')
})
