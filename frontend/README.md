# Frontend

React + Vite. Chat panel + a live SVG system map that animates as an
investigation runs (see [../docs/architecture.md](../docs/architecture.md)).

**Runs fully client-side by default** — no backend needed. `src/local/`
is a JS port of the backend's orchestrator/specialists/memory/mock-LLM
logic, running the exact same investigation against the same simulated
dataset entirely in the browser. This is what a static Vercel deploy runs.

## Setup

```bash
npm install
npm run dev
```

That's it — opens on `http://localhost:5173`, no backend required.

To drive the UI from the real Python backend instead (e.g. once real
Nemotron calls are wired up), set `VITE_API_BASE`:

```bash
cp .env.example .env    # uncomment and set VITE_API_BASE
```

Same event shapes either way, so nothing else in the app changes.

## Structure

- `src/reducer.js` — pure `(state, event) -> state` reducer driving the
  system map, activity log, and chat panel. Kept separate from React so
  the event-handling logic is testable without a browser.
- `src/api.js` — picks the local simulator (default) or a real SSE stream
  from `VITE_API_BASE`, both feeding the same `onEvent` callback shape.
- `src/local/` — client-side port of the backend: `tools.js` (data access),
  `mockLlm.js` (rule-based findings/synthesis), `memoryStore.js` (recurrence
  matching), `orchestrator.js` (ties it together, emits the same events the
  real backend's SSE stream would).
- `src/components/SystemMap.jsx` — the node/edge visualization.
- `src/components/ActivityLog.jsx` — live terminal-style event feed.
- `src/components/ChatPanel.jsx` — scenario buttons, question input, results.
