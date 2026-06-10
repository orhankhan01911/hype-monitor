import { FundingRate, FundingRateSchema } from './schemas'

const HL_API = 'https://api.hyperliquid.xyz/info'

export async function fetchHypeFundingRate(): Promise<FundingRate> {
  const res = await fetch(HL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
  })

  if (!res.ok) {
    throw new Error(`Hyperliquid API error: ${res.status}`)
  }

  const data = await res.json() as [
    { universe: Array<{ name: string }> },
    Array<{ funding: string; premium: string }>
  ]
  const [meta, ctxs] = data

  const hypeIdx = meta.universe.findIndex((a) => a.name === 'HYPE')
  if (hypeIdx === -1) throw new Error('HYPE not found in Hyperliquid universe')

  const ctx = ctxs[hypeIdx]

  return FundingRateSchema.parse({
    coin: 'HYPE',
    fundingRate: parseFloat(ctx.funding),
    premium: parseFloat(ctx.premium),
    timestamp: Date.now(),
  })
}
