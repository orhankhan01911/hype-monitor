import {
  FundingRate,
  FundingRateSchema,
  FundingHistoryEntry,
  FundingHistoryEntrySchema,
  PairSpread,
  PairSpreadSchema,
  PredictedFunding,
  PredictedFundingSchema,
} from './schemas'

const HL_API = 'https://api.hyperliquid.xyz/info'
const FETCH_TIMEOUT_MS = 10_000

type HLResponse = [
  { universe: Array<{ name: string }> },
  Array<{ funding: string; premium: string }>
]

/**
 * POST to the Hyperliquid /info endpoint with an AbortController timeout.
 * Throws a readable error on network failure, non-2xx, or timeout.
 */
async function hlPost<T>(body: unknown, label: string): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(HL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`Hyperliquid API error (${label}): ${res.status}`)
    return (await res.json()) as T
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(
        `Hyperliquid request "${label}" timed out after ${FETCH_TIMEOUT_MS}ms`
      )
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

// --- In-process TTL cache for the heavy metaAndAssetCtxs payload ---
const RATES_TTL_MS = 5_000
let _ratesCache: { data: HLResponse; expiresAt: number } | null = null

async function fetchAllRates(): Promise<HLResponse> {
  const now = Date.now()
  if (_ratesCache && _ratesCache.expiresAt > now) {
    return _ratesCache.data
  }
  const data = await hlPost<HLResponse>({ type: 'metaAndAssetCtxs' }, 'metaAndAssetCtxs')
  _ratesCache = { data, expiresAt: now + RATES_TTL_MS }
  return data
}

export async function fetchFundingRate(coin: string): Promise<FundingRate> {
  const [meta, ctxs] = await fetchAllRates()
  const idx = meta.universe.findIndex((a) => a.name === coin.toUpperCase())
  if (idx === -1) throw new Error(`${coin} not found in Hyperliquid universe`)
  return FundingRateSchema.parse({
    coin: coin.toUpperCase(),
    fundingRate: parseFloat(ctxs[idx].funding),
    premium: parseFloat(ctxs[idx].premium),
    timestamp: Date.now(),
  })
}

// Always include key coins + top N by abs funding rate
const ALWAYS_INCLUDE = ['HYPE', 'BTC', 'ETH', 'SOL']

export async function fetchTopFundingRates(limit = 15): Promise<FundingRate[]> {
  const [meta, ctxs] = await fetchAllRates()
  const now = Date.now()

  const all: FundingRate[] = meta.universe.map((asset, i) => ({
    coin: asset.name,
    fundingRate: parseFloat(ctxs[i].funding),
    premium: parseFloat(ctxs[i].premium),
    timestamp: now,
  }))

  // Always-include set
  const pinned = all.filter((r) => ALWAYS_INCLUDE.includes(r.coin))
  const pinnedCoins = new Set(pinned.map((r) => r.coin))

  // Top N by absolute funding rate (excluding already-pinned)
  const byAbs = all
    .filter((r) => !pinnedCoins.has(r.coin))
    .sort((a, b) => Math.abs(b.fundingRate) - Math.abs(a.fundingRate))
    .slice(0, limit - pinned.length)

  return [...pinned, ...byAbs]
}

/**
 * Last N funding-history entries for a coin.
 * Hyperliquid's fundingHistory requires a startTime; we look back enough hours
 * to comfortably cover N hourly funding periods, then return the most recent N.
 */
export async function fetchFundingHistory(
  coin: string,
  n = 20
): Promise<FundingHistoryEntry[]> {
  // Funding accrues hourly on HL; ask for a generous window then trim.
  const startTime = Date.now() - (n + 6) * 60 * 60 * 1000
  const raw = await hlPost<Array<{ time: number; fundingRate: string }>>(
    { type: 'fundingHistory', coin: coin.toUpperCase(), startTime },
    'fundingHistory'
  )

  const entries = raw.map((e) =>
    FundingHistoryEntrySchema.parse({
      time: e.time,
      fundingRate: parseFloat(e.fundingRate),
      coin: coin.toUpperCase(),
    })
  )

  // Most recent N (raw is chronological ascending).
  return entries.slice(-n)
}

/**
 * Predicted funding across venues (HL vs Binance vs Bybit).
 * Hyperliquid's predictedFundings returns:
 *   [ [coin, [ [venue, { fundingRate, ... }], ... ]], ... ]
 * If that endpoint is unavailable / unexpectedly shaped, fall back to HL-only
 * funding from metaAndAssetCtxs so callers always get usable data.
 */
export async function fetchPredictedFundings(): Promise<PredictedFunding[]> {
  try {
    const raw = await hlPost<
      Array<[string, Array<[string, { fundingRate: string } | null]>]>
    >({ type: 'predictedFundings' }, 'predictedFundings')

    if (!Array.isArray(raw) || raw.length === 0) throw new Error('empty')

    const out: PredictedFunding[] = []
    for (const [coin, venues] of raw) {
      const byVenue = new Map<string, number>()
      for (const [venue, info] of venues) {
        if (info && info.fundingRate != null) {
          byVenue.set(venue, parseFloat(info.fundingRate))
        }
      }
      const hl = byVenue.get('HlPerp') ?? byVenue.get('Hl') ?? byVenue.get('HL')
      // Skip coins with no HL prediction — hlFunding is required.
      if (hl == null) continue
      out.push(
        PredictedFundingSchema.parse({
          coin,
          hlFunding: hl,
          binanceFunding: byVenue.get('BinPerp') ?? byVenue.get('Binance'),
          bybitFunding: byVenue.get('BybitPerp') ?? byVenue.get('Bybit'),
        })
      )
    }
    if (out.length === 0) throw new Error('no HL venue data')
    return out
  } catch {
    // Fallback: HL-only funding from the metaAndAssetCtxs snapshot.
    const [meta, ctxs] = await fetchAllRates()
    return meta.universe.map((asset, i) =>
      PredictedFundingSchema.parse({
        coin: asset.name,
        hlFunding: parseFloat(ctxs[i].funding),
      })
    )
  }
}

/**
 * Funding-rate spread between two coins (pair-trade carry analysis).
 * netCarryAnnualized = (rateA - rateB) * 3 * 365.
 * If |spreadBps| > 5: long the lower-funding coin, short the higher-funding one.
 */
export async function fetchPairSpread(
  coinA: string,
  coinB: string
): Promise<PairSpread> {
  const [a, b] = await Promise.all([
    fetchFundingRate(coinA),
    fetchFundingRate(coinB),
  ])

  const rateA = a.fundingRate
  const rateB = b.fundingRate
  const spreadBps = (rateA - rateB) * 10_000
  const netCarryAnnualized = (rateA - rateB) * 3 * 365

  let favoredSide: PairSpread['favoredSide'] = 'neutral'
  if (Math.abs(spreadBps) > 5) {
    // Long the cheaper (lower) funding leg, short the richer (higher) one.
    favoredSide = rateA < rateB ? 'long_a_short_b' : 'long_b_short_a'
  }

  return PairSpreadSchema.parse({
    coinA: a.coin,
    coinB: b.coin,
    rateA,
    rateB,
    spreadBps,
    netCarryAnnualized,
    favoredSide,
  })
}
