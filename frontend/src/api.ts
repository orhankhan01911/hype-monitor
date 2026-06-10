import type { QueryResponse, FundingRate, ToolStep } from './types'

const BASE = '/api'

/**
 * Stream a query to /api/chat.
 * Parses Vercel AI SDK data stream format:
 *   "0:" text delta
 *   "9:" tool call
 *   "a:" tool result
 *   "d:" finish delta (with usage)
 *   "e:" finish with usage
 */
export async function streamQuery(
  query: string,
  sessionId: string,
  modelId: string,
  onChunk: (text: string) => void,
  onToolCall: (step: ToolStep) => void,
): Promise<void> {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, sessionId, modelId }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error: string }).error ?? res.statusText)
  }

  if (!res.body) throw new Error('No response body')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  // Track tool calls by index so we can update status when result arrives
  const toolCallMap = new Map<string, string>() // toolCallId -> toolName

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // Process complete lines
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? '' // keep incomplete last line

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6).trim()
      if (!raw || raw === '[DONE]') continue

      try {
        // AI SDK data stream: each line is "data: <typeCode>:<jsonPayload>"
        // The typeCode is a hex string followed by colon
        const colonIdx = raw.indexOf(':')
        if (colonIdx === -1) continue
        const typeCode = raw.slice(0, colonIdx)
        const payload = raw.slice(colonIdx + 1)

        switch (typeCode) {
          case '0': {
            // Text delta — payload is a JSON string
            const text = JSON.parse(payload) as string
            onChunk(text)
            break
          }
          case '9': {
            // Tool call
            const tc = JSON.parse(payload) as {
              toolCallId: string
              toolName: string
              args: unknown
            }
            toolCallMap.set(tc.toolCallId, tc.toolName)
            onToolCall({
              tool: tc.toolName,
              status: 'calling',
              summary: `fetching ${tc.toolName.replace(/_/g, ' ')}…`,
            })
            break
          }
          case 'a': {
            // Tool result
            const tr = JSON.parse(payload) as {
              toolCallId: string
              result: unknown
            }
            const toolName = toolCallMap.get(tr.toolCallId) ?? 'tool'
            // Build a compact summary from the result
            let summary = `${toolName} done`
            if (tr.result && typeof tr.result === 'object') {
              const r = tr.result as Record<string, unknown>
              if ('coin' in r && 'fundingRate' in r) {
                const rate = (r.fundingRate as number) * 100
                const sign = rate >= 0 ? '+' : ''
                summary = `${r.coin as string}: ${sign}${rate.toFixed(4)}%/8h`
              } else if (Array.isArray(tr.result) && tr.result.length > 0) {
                summary = `${toolName}: ${tr.result.length} results`
              } else if ('error' in r) {
                summary = `${toolName}: ${r.error}`
              }
            }
            onToolCall({ tool: toolName, status: 'done', summary })
            break
          }
          case 'd':
          case 'e':
            // Finish — nothing to do, stream will end
            break
        }
      } catch {
        // Malformed line — skip
      }
    }
  }
}

export async function fetchHistory(): Promise<QueryResponse[]> {
  const res = await fetch(`${BASE}/history`)
  if (!res.ok) throw new Error('Failed to fetch history')
  return res.json()
}

export async function fetchRates(): Promise<FundingRate[]> {
  const res = await fetch(`${BASE}/rates`)
  if (!res.ok) throw new Error('Failed to fetch rates')
  return res.json()
}
