# Cross-System Incident Investigator

Ask one question — "why did the overnight job fail?" — and get a root cause
in seconds instead of hours, with a full evidence trail across every system
involved (job scheduler, CI/CD, metrics, logs, ticketing). Built for the
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

Backend scaffold (FastAPI + orchestrator + specialists + simulated dataset)
is in place. Frontend (chat + live system-map visualization) is next.

## Setup

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env        # then fill in NEBIUS_API_KEY
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

Not yet scaffolded — see project status above.

## License

MIT — see [LICENSE](LICENSE).
