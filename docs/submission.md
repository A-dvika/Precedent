# Devpost submission — Precedent

Draft content for each Devpost field. Copy/adapt into the submission form.

## Project name

**Precedent**

## Tagline (one line)

Cross-system incident investigator with institutional memory — ask why
something broke, get a root cause in seconds with a full evidence trail,
and never re-investigate the same issue twice.

## Track

**Best Apps and Agents** — Precedent is a workflow-automation agent someone
would actually use (on-call/SRE incident triage), powered by tiered
Nemotron usage exactly as the track describes: Nemotron 3 Ultra for
reasoning-heavy synthesis, Nemotron Nano/Super for the fast, high-volume
per-system lookups.

*(Secondary fit: Coding and Agentic Engineering, if the narrative leans
harder on the specialist agents as dev-tooling. Best Apps and Agents is the
stronger match for the current build.)*

## Project description

**Problem.** In any enterprise with more than a handful of internal
systems, incident evidence is scattered — logs in one tool, deploy history
in another, metrics in a third, ticket context in a fourth. No single
system has the full picture, so on-call engineers burn hours manually
correlating timestamps across tabs before they even start diagnosing. Worse,
the same root cause often resurfaces weeks later because nobody remembers a
3-week-old deprioritized ticket at 2am.

**Solution.** Precedent takes one plain-language question — "why did the
overnight job fail?" — and investigates across every relevant system in
parallel, the way a human would, then returns a single synthesized root
cause with a full evidence trail and a suggested action. The second time
the same failure happens, it checks institutional memory *first* and
recognizes the recurrence instantly instead of re-investigating from
scratch, explicitly citing the prior incident (hence the name).

**How it works.** A reasoning-tier orchestrator (Nemotron 3 Ultra) breaks
the question down and checks memory for a matching prior incident. On a
miss, it dispatches four specialist agents in parallel (Nemotron Nano/
Super) — one each for deploy history, service metrics, job logs, and
ticketing — which independently investigate their domain and report
structured findings. The orchestrator then synthesizes those findings into
one root-cause narrative with cited evidence and a suggested action, and
writes the result to memory for next time. Every step streams live to the
UI: a system-map visualization lights up each domain as it's checked, and
an activity log shows the reasoning happening in real time.

**Proof it generalizes.** The demo includes three scenarios, not one: a
full multi-system investigation (a shared-dependency regression cascading
into job timeouts), an instant-recall recurrence of that same incident, and
a third, unrelated failure (a certificate expiry on a different service)
that the system investigates honestly — returning medium confidence and a
single piece of evidence rather than forcing a tidy four-system story it
doesn't have. That honesty is deliberate: it's what makes the other two
scenarios' high confidence credible.

**What's built.** Full working system end to end, including a fully
client-side demo mode (deterministic, rule-based logic standing in for the
Nemotron calls, same input/output shape) so the shareable demo link needs
no backend and never depends on API availability. The real-Nemotron-call
path in the backend is fully wired and hardened — JSON-mode fallback,
clear auth/model-not-found error messages, a one-command connection-check
script — so switching from demo to live Nemotron reasoning is a one-line
config change, not a rewrite.

## How Nebius / NVIDIA tools were used

- **Nemotron 3 Ultra** via **Nebius Token Factory** — the orchestrator and
  synthesis layer: decomposing the question, checking memory, merging
  specialist findings into one root-cause answer with citations.
- **Nemotron Nano/Super** via **Nebius Token Factory** — one specialist
  agent per tool-domain, running in parallel, doing fast/narrow lookups.
  This tiering (Ultra for reasoning, Nano/Super for volume) follows the
  hackathon's own guidance on how to use the model family efficiently.
- **Nebius AI Cloud** — intended target for hosting the backend +
  institutional-memory store (pgvector) once past the demo stage.
- Architecture designed so real Nemotron calls are a drop-in replacement
  for the demo-mode mocks: same prompts, same structured JSON contract,
  same event stream to the UI.

## Feedback on Nebius Token Factory / NVIDIA tools

*(Fill in after wiring up the real API key — notes on onboarding
friction, docs clarity, latency, JSON-mode support, etc. Worth mentioning
specifically: whether `response_format: json_object` is supported the way
OpenAI's API supports it, since the backend had to build a fallback for
providers that don't.)*

## Repository

<https://github.com/A-dvika/Precedent> — MIT licensed, README with full
setup instructions for both demo mode (no key needed) and live mode
(add `NEBIUS_API_KEY`, run `scripts/check_connection.py` to verify).

## Demo video outline (≤3 minutes)

1. **0:00–0:20** — Hook: state the problem in one sentence (evidence
   scattered across tools, hours of manual correlation) over a quick shot
   of the connected-systems strip.
2. **0:20–1:10** — Act 1: click the scenario button, narrate the system
   map lighting up per specialist, land on the synthesized root cause +
   evidence trail + suggested action. Call out the elapsed-time badge.
3. **1:10–1:40** — Act 2: click the second scenario, the instant-recall
   moment. Emphasize the elapsed-time contrast (seconds vs. a fraction of
   a second) and the memory panel now showing two entries.
4. **1:40–2:15** — Act 3: click the third scenario, show the *honest*
   medium-confidence result — proves it's not scripted to always find a
   perfect story.
5. **2:15–2:45** — Architecture in one breath: Nemotron 3 Ultra for
   orchestration/synthesis, Nemotron Nano/Super for parallel specialists,
   via Nebius Token Factory. Mention the demo-mode/live-mode drop-in
   design if time allows.
6. **2:45–3:00** — Close: repo link, "built for Nebius x NVIDIA Global AI
   Hackathon."

## Public demo URL

*(Fill in once the Vercel deploy is live — frontend only, runs fully
client-side, see README "Deploying the demo" section.)*
