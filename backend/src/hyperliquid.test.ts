import { fetchHypeFundingRate } from './hyperliquid'

test('fetchHypeFundingRate returns a valid FundingRate for HYPE', async () => {
  const result = await fetchHypeFundingRate()
  expect(result.coin).toBe('HYPE')
  expect(typeof result.fundingRate).toBe('number')
  expect(typeof result.premium).toBe('number')
  expect(result.timestamp).toBeGreaterThan(0)
}, 10000)
