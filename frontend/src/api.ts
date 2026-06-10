import type { APIResponse } from './types'

const BASE = '/api'

export async function triggerAnalysis(): Promise<APIResponse> {
  const res = await fetch(`${BASE}/analyze`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error: string }).error)
  }
  return res.json()
}

export async function fetchTraces(): Promise<APIResponse[]> {
  const res = await fetch(`${BASE}/traces`)
  if (!res.ok) throw new Error('Failed to fetch traces')
  return res.json()
}

export async function checkHealth(): Promise<{ status: string; timestamp: number }> {
  const res = await fetch(`${BASE}/health`)
  if (!res.ok) throw new Error('Health check failed')
  return res.json()
}
