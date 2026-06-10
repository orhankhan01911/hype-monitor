import { FundingRateSchema, AnalysisResultSchema } from './schemas'

test('FundingRateSchema parses valid data', () => {
  const result = FundingRateSchema.parse({
    coin: 'HYPE',
    fundingRate: 0.0001,
    premium: 0.00005,
    timestamp: Date.now(),
  })
  expect(result.coin).toBe('HYPE')
  expect(result.fundingRate).toBe(0.0001)
})

test('FundingRateSchema rejects missing fields', () => {
  expect(() => FundingRateSchema.parse({ coin: 'HYPE' })).toThrow()
})

test('AnalysisResultSchema parses valid data', () => {
  const result = AnalysisResultSchema.parse({
    coin: 'HYPE',
    fundingRate: 0.0001,
    sentiment: 'bullish',
    confidence: 0.85,
    summary: 'Positive funding indicates bullish bias.',
    recommendation: 'long',
    riskLevel: 'medium',
    timestamp: Date.now(),
  })
  expect(result.sentiment).toBe('bullish')
  expect(result.recommendation).toBe('long')
})

test('AnalysisResultSchema rejects invalid sentiment', () => {
  expect(() =>
    AnalysisResultSchema.parse({
      coin: 'HYPE',
      fundingRate: 0.0001,
      sentiment: 'very_bullish',
      confidence: 0.85,
      summary: 'test',
      recommendation: 'long',
      riskLevel: 'medium',
      timestamp: Date.now(),
    })
  ).toThrow()
})
