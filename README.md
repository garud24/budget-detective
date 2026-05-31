# Budget Detective — Proof of Concept

Budget Detective is a compact POC that helps non-technical users explore Washington State vendor payment data using plain-English insights, charts, and audited AI intent handling.

---

## 1. The problem I set out to solve

Washington State publishes vendor payment records publicly — who paid what to whom, across which agency, under which spending category. The data is real, detailed, and freely available. The problem is that it only exists as a raw CSV. A journalist investigating a contract, a civic watchdog checking a vendor, a resident curious about where their tax money went — none of them can do anything useful with that file without knowing SQL, Excel pivot tables, or how to write a script.

The specific pain is the gap between data being *available* and data being *accessible*. Transparency that requires technical skill to use is not really transparency.

I chose this direction over a few alternatives I considered. I could have built a general-purpose chat interface that lets users query the data in freeform natural language — but that approach has unpredictable failure modes and is hard to audit. I could have built a more traditional filter-and-sort dashboard — but that still requires the user to understand the data structure before they can form a useful question. I chose pre-computed, question-framed insights because the analysis is the same for every user: the top agency, the top vendor, the dominant category. Doing that work once at load time and presenting it as plain-language answers removes the technical barrier entirely without sacrificing accuracy.

---

## 2. Tech and architectural choices

### What I built and how it works

The app has two runtimes:

- **React frontend (Vite + TypeScript)** — loads the CSV at startup, computes all aggregates in the browser, and renders the dashboard. Typed questions are sent to the backend for AI intent classification; suggested button clicks resolve locally with no network call.
- **Express backend (Node + TypeScript, port 3001)** — handles two responsibilities: classifying natural-language questions into structured intents using OpenAI GPT-4.1-mini, and persisting an audit log of every AI interaction to disk.

**Data flow for a typed question:**

```
User types question
  → frontend POSTs to /api/understand-question
    → server sends question to GPT-4.1-mini with a domain-aware prompt
    → server returns a normalized intent string (e.g. "top_vendor")
  → frontend runs local aggregation to compute the answer
  → frontend renders plain-language answer + methodology explanation
  → every step is logged to server/logs/ai-logs.jsonl
```

**Data flow for a suggested button click:**

```
User clicks a pre-written question
  → frontend maps it directly to an insight ID (no network call)
  → logs the selection via aiLogger
  → detail panel updates immediately
```

**Key files:**

| File | Purpose |
|---|---|
| `src/types/payment.ts` | All shared TypeScript types — raw CSV shape, normalized row, chart item, insight object |
| `src/services/csvLoader.ts` | Fetches and parses the CSV via PapaParse, normalizes rows, filters zero/negative amounts |
| `src/services/insightEngine.ts` | Pure analysis functions — aggregation, rankings, monthly trends, currency formatting |
| `src/services/aiQuestionService.ts` | Sends typed questions to the backend, returns a classified intent, logs model I/O |
| `src/services/aiLogger.ts` | Centralized audit logging — all user inputs and model interactions, persisted to server |
| `src/App.tsx` | Root component — loads data, owns question dispatch logic, renders the full page |
| `src/components/QuestionBox.tsx` | Search bar and suggested question buttons, distinguishes button vs. typed source |
| `src/components/InsightCard.tsx` | Clickable insight card in the left panel |
| `src/components/SpendingChart.tsx` | Bar chart rendered in the detail panel for a selected insight |
| `src/components/TrendCard.tsx` | Summary card with a headline number and a monthly sparkline chart |
| `src/components/MiniBarList.tsx` | Proportional bar list for the top agencies summary card |
| `src/components/MiniDonut.tsx` | Donut chart for the spending mix summary card |
| `server/index.ts` | Express server — intent classification endpoint, log persistence endpoint, log retrieval |

### AI governance

The POC separates intent classification from answer generation. The AI never produces the answer directly — it only classifies the question into one of ~10 known intents. The actual answer is computed locally from the dataset using deterministic aggregation functions. This means the answer can always be verified against the source data.

Every AI interaction is logged:
- User inputs and interaction type (`question_button`, `typed_question`, `suggested_selection`)
- Model request payloads and raw responses
- Logs are persisted to `server/logs/ai-logs.jsonl`, rotated at 5 MB, with up to 5 backups retained
- Logs are retrievable via `GET /api/logs`

The server also has a `fallbackIntent` keyword router. If the OpenAI call fails or the API key is unavailable, the fallback runs instead. A POC that breaks silently because an API key expired is worse than one with a slightly simpler fallback.

### What was explicitly deferred

These were conscious out-of-scope decisions, not oversights:

- **Authentication and access control** — the app is read-only against a public dataset, so auth adds complexity with no security benefit at POC stage.
- **Arbitrary natural language queries** — the current intent system supports around eight question types. Answering "how did agency X's spending change year over year" would require a query planner, not just an intent classifier. That is a separate architecture decision.
- **Pagination and filtering** — the full dataset loads into memory in the browser. Fine at this scale; deferred because it adds state management complexity that would obscure the core idea in a POC.
- **Per-component error states and loading skeletons** — the app has basic loading and error screens but no per-component fallbacks.

### What I would change in production

- **Hardcoded server URL** — `localhost:3001` is hardcoded in `aiQuestionService.ts`. It needs to be an environment variable, with the frontend and backend deployed as separate services.
- **Log storage** — flat JSONL with manual rotation is fine locally. Production needs structured logging to a managed store (Datadog, CloudWatch, etc.) with retention policies and alerting on anomalous intent distributions — a spike in `unknown` intents is a signal that user questions are drifting outside what the model handles.
- **Client-side aggregation** — works for this dataset. At production scale, aggregates should be pre-computed at ingestion time and served from a database, not recalculated in the browser on every load.
- **Log endpoint access control** — `GET /api/logs` has no authentication. Anyone who can reach the server can read every AI interaction. That needs to be locked down before this handles any sensitive data.
- **`(import.meta as any)` cast in aiLogger.ts** — a type hack used to read the Vite env variable. Should be replaced with a proper `vite-env.d.ts` declaration.

---

## 3. AI usage log

**Interaction 1 — Intent classification prompt design**

I asked the AI to write an OpenAI prompt that classifies user questions about spending data into a fixed set of intents. It produced a clean prompt with intents like `top_agency`, `top_vendor`, and `total_spending`. What it didn't account for was the domain-specific constraint that in this dataset, vendors receive money — they don't spend it. A user asking "which vendor spent the most?" would get classified as `top_vendor`, which is the right intent label but produces a semantically wrong answer.

I pushed back and added two things myself: an explicit rule in the prompt (`if the user asks which vendor spent the most/least, return invalid_vendor_spending`) and a new intent value `invalid_vendor_spending` that the frontend handles as a clarifying correction rather than an answer. The AI gave me the structure; I provided the domain knowledge.

**Interaction 2 — Expanding the logging service**

I asked the AI to extend the existing `aiLogger.ts` to persist logs to a server endpoint in addition to the in-memory array. It returned a version with `sendLogToServer`, three distinct log functions (`logAIInput`, `logSuggestedSelection`, `logAIOutput`), and fire-and-forget `void` calls so logging never blocks the UI. I kept the structure largely as-is. One thing I noted for follow-up: the AI used `(import.meta as any)?.env` to access the Vite environment variable, which is a type hack. I flagged it as something to clean up before production — it should use a proper `vite-env.d.ts` declaration instead.

**Interaction 3 — Error handling in the question service**

I asked the AI to review the codebase before pushing and it flagged two issues: a hardcoded `localhost:3001` URL and missing error handling around the fetch call in `aiQuestionService.ts`. I asked it to fix only the second one — the error handling — because fixing the hardcoded URL is a deployment concern I'm tracking separately and didn't want mixed into the same change. The AI wrapped the fetch in a try/catch that returns `"unknown"` on network failure and added an explicit `!response.ok` check before calling `.json()`. I kept the fix exactly as written. The decision to split the two issues was mine.

---

## How to run locally

Start the frontend:

```bash
npm install
npm run dev
```

Start the backend:

```bash
cd server
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`. The backend runs on `http://localhost:3001`. Both need to be running for typed questions to work. Suggested button clicks work without the backend.

Build the frontend:

```bash
npm run build
```

---

## What's in the repo

```
src/                  React frontend and components
src/services/         Data loading, analysis, AI, and logging services
src/components/       UI components
src/types/            Shared TypeScript types
public/data/          Washington State vendor payments CSV
server/               Express intent classification and logging backend
server/logs/          Persisted AI audit logs (JSONL)
```
