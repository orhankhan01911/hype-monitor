import { FundingRate, FundingRateSchema } from './schemas'

const HL_API = 'https://api.hyperliquid.xyz/info'

type HLResponse = [
  { universe: Array<{ name: string }> },
  Array<{ funding: string; premium: string }>
]

async function fetchAllRates(): Promise<HLResponse> {
  const res = await fetch(HL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
  })
  if (!res.ok) throw new Error(`Hyperliquid API error: ${res.status}`)
  return res.json() as Promise<HLResponse>
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
