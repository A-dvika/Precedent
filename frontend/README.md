# Frontend

React + Vite. Chat panel + a live SVG system map that animates as the
backend's `/investigate` SSE stream comes in (see [../docs/architecture.md](../docs/architecture.md)).

## Setup

```bash
npm install
cp .env.example .env    # VITE_API_BASE, defaults to http://localhost:8000
npm run dev
```

Requires the backend running (see [../backend](../backend)).

## Structure

- `src/reducer.js` — pure `(state, SSE event) -> state` reducer driving the
  system map and chat panel. Kept separate from React so the event-handling
  logic is testable without a browser.
- `src/api.js` — streams `/investigate` as SSE via `fetch` + `ReadableStream`
  (plain `EventSource` can't send a POST body).
- `src/components/SystemMap.jsx` — the node/edge visualization.
- `src/components/ChatPanel.jsx` — question input, job picker, results.
