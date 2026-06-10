import type { QueryResponse } from './types'

const BASE = '/api'

export async function sendQuery(query: string): Promise<QueryResponse> {
  const res = await fetch(`${BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error: string }).error)
  }
  return res.json()
}

export async function fetchHistory(): Promise<QueryResponse[]> {
  const res = await fetch(`${BASE}/history`)
  if (!res.ok) throw new Error('Failed to fetch history')
  return res.json()
}

export async function checkHealth(): Promise<{ status: string; timestamp: number }> {
  const res = await fetch(`${BASE}/health`)
  if (!res.ok) throw new Error('Health check failed')
  return res.json()
}
