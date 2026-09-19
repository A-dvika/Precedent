# Precedent

Cross-system incident investigator with institutional memory. Ask one
question — "why did the overnight job fail?" — and get a root cause in
seconds instead of hours, with a full evidence trail across every system
involved (job scheduler, CI/CD, metrics, logs, ticketing). The second time
the same failure happens, Precedent recognizes it instantly instead of
re-investigating from scratch — literally citing precedent. Built for the
[Nebius x NVIDIA Global AI Hackathon](https://nebius-x-nvidia-global-ai-hackathon.devpost.com/).

See [docs/architecture.md](docs/architecture.md) for the system design and
[docs/demo_script.md](docs/demo_script.md) for the two-act demo scenario.

## Why this exists

In any enterprise with more than a handful of internal systems, incident
evidence is scattered — logs here, deploy history there, ticket context
somewhere else — and no one system has the full picture. On-call engineers
burn hours manually correlating timestamps across tabs. This investigates
across all of it in parallel and answers with citations, not a guess.

## How it uses Nebius / NVIDIA

- **Nemotron 3 Ultra** (via Nebius Token Factory) — orchestration and final
  synthesis: decomposing the question, merging specialist findings into one
  root-cause answer with an evidence trail.
- **Nemotron Nano/Super** (via Nebius Token Factory) — one specialist per
  tool-domain (deploys, metrics, logs, tickets), doing fast, narrow lookups
  in parallel.
- Institutional memory layer checks for recurring incidents *before*
  dispatching specialists, so known issues get an answer near-instantly.

## Project status

Fully working end to end in **demo mode** — no API key required. Backend
(FastAPI + orchestrator + specialists + simulated dataset) and frontend
(chat panel + live SVG system map) are wired together via SSE, and both
demo acts (full investigation, then instant memory recall) run correctly
against the seeded dataset. See [docs/demo_script.md](docs/demo_script.md).

Demo mode (`DEMO_MODE`, auto-enabled when `NEBIUS_API_KEY` is empty) swaps
the Nemotron calls for deterministic, rule-based logic over the same
structured tool output a real model call would see — same input/output
shape, so switching to real Nemotron calls through Token Factory is a
drop-in change, not a rewrite. That real-call path is wired but not yet
verified — needs an API key and confirmation of the exact base URL / model
catalog names from the Token Factory console.

## Setup

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env        # works as-is in demo mode, no key needed
uvicorn app.main:app --reload
```

Health check: `GET http://localhost:8000/health`

Run an investigation:

```bash
curl -N -X POST http://localhost:8000/investigate \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"why did the overnight settlement job fail?\", \"job_name\": \"settlement_batch_job\"}"
```

Run it again with `job_name: fx_reval_job` after the first call to see the
memory-hit path (Act 2 of the demo script).

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Opens on `http://localhost:5173`. Requires the backend running on `:8000`.

## License

MIT — see [LICENSE](LICENSE).
