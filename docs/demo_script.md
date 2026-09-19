# Demo script

Two acts, same underlying root cause, to show both the full investigation
loop and the payoff of institutional memory.

## Act 1 — full investigation

**Question:** "Why did the overnight settlement job fail?"
**Job:** `settlement_batch_job`, run `sb-20260910-0217`

What the specialists find:
- **Deploys** — `pricing-lib` v2.3.1 deployed to `pricing-service` at 01:45,
  ~25 minutes before the failure window.
- **Metrics** — `pricing-service` p99 latency jumps from ~42ms baseline to
  ~4000ms right after the 01:45 deploy.
- **Logs** — `settlement_batch_job` repeatedly calls `pricing-service`,
  hits slow responses, retries, exhausts retries, fails at 02:17.
- **Tickets** — `PERF-4821`, open, filed three weeks earlier, flags exactly
  this regression in `pricing-lib` 2.3.1 under load. Deprioritized, shipped anyway.

**Expected synthesis:** the job didn't fail on its own — a deploy to a shared
dependency introduced a known-but-deprioritized performance regression, which
cascaded into timeouts. Cites all four findings plus the ticket.

## Act 2 — memory payoff

**Question:** "Why did the FX reval job fail?"
**Job:** `fx_reval_job`, run `fx-20260928-0305`

Same underlying cause resurfaces (the ticket was never actually fixed).
The orchestrator checks memory *first* and gets an immediate match against
the Act 1 incident — no specialists dispatched, answer returned near-instantly,
with a pointed callout that this is a *recurrence* of an unresolved issue and
a recommendation to escalate the still-open ticket.

## Why this pairing

- Proves the "hours -> seconds" claim twice, at two different speeds (full
  multi-agent investigation vs. instant recall).
- Turns "institutional memory" into a story with a point: the system surfaces
  an organizational failure (a known risk that got ignored) that a human
  doing manual 2am triage would likely miss.
- Natural closer for the demo video: "same problem, caught instantly the
  second time — that's the compounding value of institutional memory."
