# Precedent

Cross-system incident investigator with institutional memory. Ask one
question — "why did the overnight job fail?" — and get a root cause in
seconds instead of hours, with a full evidence trail across every system
involved (job scheduler, CI/CD, metrics, logs, ticketing). The second time
the same failure happens, Precedent recognizes it instantly instead of
re-investigating from scratch — literally citing precedent. Built for the
[Nebius x NVIDIA Global AI Hackathon](https://nebius-x-nvidia-global-ai-hackathon.devpost.com/).

See [docs/architecture.md](docs/architecture.md) for the system design,
[docs/demo_script.md](docs/demo_script.md) for the three-act demo scenario,
and [docs/submission.md](docs/submission.md) for the Devpost submission
draft (description, track, video outline).

The UI also tracks **institutional memory** as a visible, growing panel (not
just an internal mechanic), a **connected-systems** strip showing which
tools are wired in, and a **stats bar** estimating time saved across every
investigation run in the session.

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

Fully working end to end in **demo mode** — no API key, and no backend
required to try it. All three demo acts (full investigation, instant memory
recall, and a genuinely new/unresolved incident) run correctly against the
seeded dataset. See [docs/demo_script.md](docs/demo_script.md).

Demo mode swaps the Nemotron calls for deterministic, rule-based logic over
the same structured tool output a real model call would see — same
input/output shape, so switching to real Nemotron calls through Token
Factory is a drop-in change, not a rewrite. There are two copies of this
demo-mode logic, kept in lockstep:

- **`backend/`** — the real architecture story (FastAPI, orchestrator,
  specialists, SSE), with `DEMO_MODE` auto-enabled when `NEBIUS_API_KEY` is
  empty. This is where real Nemotron calls get wired in.
- **`frontend/src/local/`** — a JS port of the same logic running entirely
  in the browser, no backend needed. This is what the standalone Vercel
  deploy runs, so the shareable demo link never depends on a hosted backend
  staying up.

**Going live is a one-step change** — add `NEBIUS_API_KEY` to `backend/.env`
and leave `DEMO_MODE` unset; it auto-detects the key and switches every
Nemotron call from mock to real with no other code changes. The real-call
path itself is hardened, not just wired: JSON-mode requests fall back to
plain-text parsing if a provider rejects `response_format` (with a
markdown-fence-tolerant parser), auth/model-not-found errors surface as
clear messages instead of generic failures, and the app fails fast at
startup instead of mid-request if `DEMO_MODE=false` is forced with no key.

Run `python scripts/check_connection.py` (from `backend/`) right after
adding your key — it pings both configured models directly and reports
`[OK]`/`[FAIL]` per model, so you know in seconds whether the key, base
URL, and model catalog names are right, without running a full
investigation. (The guessed default base URL, `api.tokenfactory.nebius.com`,
already returns a real structured `401` — not a connection error — when
tested with a bad key, which is a strong signal it's correct; model catalog
names are the more likely thing to need adjusting.)

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

Health check: `GET http://localhost:8000/health` — reports `"mode": "demo"` or
`"mode": "live"` plus the active model names.

Adding a real key later? Run `python scripts/check_connection.py` first
(see "Project status" above) to confirm it's wired correctly.

Run an investigation:

```bash
curl -N -X POST http://localhost:8000/investigate \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"why did the overnight settlement job fail?\", \"job_name\": \"settlement_batch_job\"}"
```

Run it again with `job_name: fx_reval_job` after the first call to see the
memory-hit path (Act 2), or `job_name: nightly_auth_sync_job` for the
new/unresolved-incident path (Act 3).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5173` — runs fully client-side, no backend
needed. This is also the exact setup a Vercel deploy runs: build command
`npm run build`, output directory `dist`, root directory `frontend`.

## Deploying the demo (Vercel)

The frontend is a static Vite build with no backend dependency, so it
deploys as-is:

1. Import this repo in Vercel
2. Set **Root Directory** to `frontend`
3. Framework preset: Vite (build command `npm run build`, output `dist`)
4. Leave `VITE_API_BASE` unset — deploy

No environment variables, no separate backend to host.

## License

MIT — see [LICENSE](LICENSE).
