# HYPE Monitor — AI Agent for Perpetuals Funding

Production-grade demo of the [Pear Protocol](https://pearprotocol.io) AI stack. Multi-step agentic reasoning over Hyperliquid perpetuals funding rates: natural language queries → tool calling loop → OpenRouter Claude → streaming responses with Langfuse observability.

## Architecture

```
User Query (POST /api/chat)
        ↓
Vercel AI SDK streamText (sessionId tracked)
        ↓
Tool Calling Loop (max 5 steps)
  ├─ getFundingRate(symbol)
  ├─ getTopFundingRates()
  ├─ getFundingHistory(symbol)
  ├─ comparePair(symbol1, symbol2)
  └─ getPredictedFundings(symbol)
        ↓
Hyperliquid Public API (metaAndAssetCtxs, fundingHistory, predictedFundings)
        ↓
OpenRouter → Claude 3 (via @ai-sdk/openai)
        ↓
Langfuse Trace/Span/Generation (session tracking + scoring)
        ↓
Streaming SSE response to frontend
```

## Stack

| Layer | Technology |
|---|---|
| Runtime | TypeScript 5, Node 18+, Express 4 |
| AI orchestration | [Vercel AI SDK 3](https://sdk.vercel.ai) — `streamText`, `generateText`, tool calling |
| Model gateway | [OpenRouter](https://openrouter.ai) → Claude 3.5 Sonnet via @ai-sdk/openai |
| Schema validation | [Zod 3](https://zod.dev) — tool input/output schemas |
| Observability | [Langfuse v3](https://langfuse.com) — trace/span/generation hierarchy, sessions, scoring |
| Data source | [Hyperliquid](https://hyperliquid.xyz) public API (no key required) |
| Frontend | React 18 + Vite + Framer Motion + TailwindCSS + IBM Plex fonts |
| Caching | In-memory TTL cache for HL API responses |
| Rate limiting | 10 req/min per IP |

## Quickstart

**1. Clone and install**
```bash
git clone https://github.com/orhankhan01911/hype-monitor
cd hype-monitor
cd backend && npm install
cd ../frontend && npm install
```

**2. Configure backend**
```bash
cd backend && cp .env.example .env
```

Fill in `.env`:
```bash
OPENROUTER_API_KEY=sk-or-v1-...           # https://openrouter.ai/keys
LANGFUSE_PUBLIC_KEY=pk-lf-...             # https://cloud.langfuse.com
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com
PORT=3001
```

> **Langfuse regions**: Use `https://jp.cloud.langfuse.com` for Japan, `https://cloud.langfuse.com` for US/EU.

**3. Run**
```bash
# Terminal 1: backend
cd backend && npm run dev      # http://localhost:3001

# Terminal 2: frontend
cd frontend && npm run dev     # http://localhost:5173
```

## API Reference

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/chat` | **Streaming** agentic query. Body: `{ query, sessionId?, modelId? }`. Returns SSE with tool calls + LLM response. |
| `POST` | `/api/analyze` | Non-streaming alias for `/api/chat`, returns `QueryResponse` JSON. |
| `GET` | `/api/rates` | Top 20 funding rates across all symbols. Returns `FundingRate[]`. |
| `GET` | `/api/history` | Last 20 queries + responses. Returns `QueryResponse[]`. |
| `GET` | `/api/health` | Health check. Returns `{ status: 'ok', timestamp }`. |

## Tool Calling

The LLM has 5 tools available for Hyperliquid perpetuals analysis:

- **`getFundingRate(symbol)`** — Current funding rate + premium for a symbol
- **`getTopFundingRates()`** — Top 20 funding rates (net carry opportunities)
- **`getFundingHistory(symbol, days?)`** — Historical funding trends
- **`comparePair(symbol1, symbol2)`** — Spread analysis (net carry, favored direction)
- **`getPredictedFundings(symbol)`** — Cross-venue comparison (HL vs Binance vs Bybit)

Tool calls are streamed to the frontend, then the LLM synthesizes a response.

## Langfuse Tracing

Every chat request creates a **Trace** containing:
- **Metadata**: `sessionId`, `userId` (optional), query intent
- **Spans**: Nested function calls (HL API fetches, LLM generations)
- **Generations**: Full LLM payloads (model, tokens, latency, tool calls)
- **Scores**: Manual feedback scoring for response quality (optional)

Example trace hierarchy:
```
Trace: session_abc123 / query="what's HYPE's funding?"
  ├─ Span: tool_call_getFundingRate
  │   └─ Generation: hl_api_fetch (tokens: 0, latency: 145ms)
  └─ Span: llm_generation
      └─ Generation: claude-3-sonnet (tokens: 1240 in + 234 out, latency: 320ms)
```

Sessions persist across queries, enabling conversation history and quality trends in Langfuse.

## Development

```bash
# Backend tests
cd backend && npm test

# Linting
npm run lint

# Type check
npm run typecheck
```

Hyperliquid tests make real HTTP calls (no key needed). Langfuse tracing integration is skipped unless `.env` keys are present.
