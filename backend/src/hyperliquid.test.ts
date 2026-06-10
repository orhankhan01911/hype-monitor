import { fetchFundingRate, fetchTopFundingRates } from './hyperliquid'

test('fetchFundingRate returns a valid FundingRate for HYPE', async () => {
  const result = await fetchFundingRate('HYPE')
  expect(result.coin).toBe('HYPE')
  expect(typeof result.fundingRate).toBe('number')
  expect(typeof result.premium).toBe('number')
  expect(result.timestamp).toBeGreaterThan(0)
}, 10000)

test('fetchTopFundingRates returns at least 4 coins including HYPE/BTC/ETH', async () => {
  const rates = await fetchTopFundingRates(10)
  expect(rates.length).toBeGreaterThanOrEqual(4)
  const coins = rates.map((r) => r.coin)
  expect(coins).toContain('HYPE')
  expect(coins).toContain('BTC')
  expect(coins).toContain('ETH')
  rates.forEach((r) => {
    expect(typeof r.fundingRate).toBe('number')
    expect(r.timestamp).toBeGreaterThan(0)
  })
}, 10000)
