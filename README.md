# HYPE Monitor — Funding Pipeline Tracer

Live demo of the [Pear Protocol](https://pearprotocol.io) stack: fetch HYPE perpetuals funding rates from Hyperliquid, analyze them with an AI pipeline, and trace every request through Langfuse.

```
Hyperliquid API → Vercel AI SDK (generateObject) → OpenRouter → Claude 3 Haiku → Langfuse
```

## Stack

| Layer | Technology |
|---|---|
| Data source | [Hyperliquid](https://hyperliquid.xyz) public API (no key required) |
| AI orchestration | [Vercel AI SDK](https://sdk.vercel.ai) — `generateObject()` with Zod schema |
| Model gateway | [OpenRouter](https://openrouter.ai) → Claude 3 Haiku |
| Schema validation | [Zod 3](https://zod.dev) — end-to-end typed pipeline |
| Observability | [Langfuse](https://langfuse.com) — Trace → Span → Generation hierarchy |
| Frontend | React 18 + Vite + [Motion](https://motion.dev) + TailwindCSS |

## Setup

**1. Install dependencies**
```bash
git clone https://github.com/orhankhan01911/hype-monitor
cd hype-monitor
npm run install:all
```

**2. Configure environment**
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```
OPENROUTER_API_KEY=sk-or-v1-...    # https://openrouter.ai/keys
LANGFUSE_PUBLIC_KEY=pk-lf-...      # https://cloud.langfuse.com
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com
```

**3. Run**
```bash
npm run dev
# Backend:  http://localhost:3001
# Frontend: http://localhost:5173
```

## How it works

1. Click **▶ ANALYZE** in the dashboard
2. `GET /api/analyze` triggers `runFundingAnalysis()` in the Express backend
3. `fetchHypeFundingRate()` POSTs to Hyperliquid's `/info` endpoint — no API key needed
4. Vercel AI SDK's `generateObject()` sends the rate data to OpenRouter with a **Zod schema**
5. OpenRouter routes to Claude 3 Haiku, which returns a validated JSON object
6. The response is shaped into `AnalysisResult` (sentiment, confidence, recommendation, risk level)
7. Every call creates a **Langfuse Trace → Span → Generation** with token counts + latency
8. The React frontend animates results with Motion.dev micro-interactions

## Langfuse trace structure

```
Trace: "funding-analysis"
  metadata: { coin: "HYPE", source: "hyperliquid" }
  └─ Span: "ai-analysis"
       input: { fundingRate, premium }
       └─ Generation: "funding-interpretation"
            model: anthropic/claude-3-haiku
            input: [{ role: "user", content: "..." }]
            output: { sentiment, confidence, summary, recommendation, riskLevel }
            usage: { promptTokens, completionTokens }
```

## API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/analyze` | Run full pipeline, returns `APIResponse` |
| `GET` | `/api/traces` | Last 20 cached results |

## Running tests

```bash
cd backend && npm test
```

The Hyperliquid test makes a real HTTP call (no key needed). The pipeline integration test is skipped unless `.env` keys are present.
