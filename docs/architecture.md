# Architecture

## Problem

Enterprise incident investigation is slow because evidence is scattered
across disconnected systems (CI/CD, job schedulers, metrics, logs, ticketing).
No single tool has the full picture, so on-call engineers spend hours manually
correlating timestamps across tabs before they even start fixing anything.

## Approach

One question in -> parallel evidence-gathering across tool-domains -> a single
synthesized, cited answer out. A memory layer means recurring failures get
recognized instantly instead of re-investigated from scratch.

```
question
   |
   v
orchestrator (Nemotron 3 Ultra) --- checks memory first
   |
   |-- memory hit --> instant answer, citing the prior incident
   |
   `-- memory miss --> dispatch specialists in parallel
                          |
              +-----------+-----------+-----------+
              |           |           |           |
           deploys      metrics       logs      tickets
         (Nemotron Nano, one per tool-domain)
              |           |           |           |
              +-----------+-----------+-----------+
                          |
                  synthesizer (Nemotron 3 Ultra)
                  root cause + evidence trail + suggested action
                          |
                  written back to memory
                          |
                          v
              system-map UI (nodes light up per specialist,
              edges drawn for correlated evidence) + chat panel
```

## Component -> Nebius/NVIDIA mapping

| Component | Role | Tech |
|---|---|---|
| Orchestrator / synthesizer | decompose question, merge findings, reasoning | Nemotron 3 Ultra via Nebius Token Factory |
| Specialists | fast, narrow per-tool-domain lookups, run in parallel | Nemotron Nano/Super via Token Factory |
| Tool connectors | read-only adapters (simulated for the demo) | plain Python functions, swappable for real APIs |
| Memory | recognize recurring incidents | keyword-signature match (v1); pgvector + real embeddings on Nebius AI Cloud (v2) |
| Backend | orchestration + SSE event stream | FastAPI |
| Frontend | live system map + chat | React, driven by the SSE stream |

## Why this shape

The manager/specialist split maps directly onto how Nebius describes tiered
model usage: Ultra for reasoning-heavy synthesis, Nano/Super for high-volume,
low-latency per-tool checks. Running specialists in parallel (rather than one
big sequential agent loop) is both faster and gives the system-map UI real
signal to visualize — a node lights up when its specialist is actually doing
work.
