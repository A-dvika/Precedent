# Demo script

Three acts: a full investigation, the institutional-memory payoff, and a
genuinely different, unresolved incident — to show both the headline
feature and that the system isn't hardcoded to one story.

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

## Act 3 — a genuinely new, unresolved issue

**Question:** "Why did the nightly auth sync job fail?"
**Job:** `nightly_auth_sync_job`, run `auth-20261015-0300`

A different dependency (`auth-gateway`), a different failure shape (TLS
certificate expiry, not a timeout), and no pre-existing ticket or deploy to
correlate against.

What the specialists find:
- **Deploys** — nothing in the lookback window. Not relevant.
- **Metrics** — no metrics tracked for `auth-gateway`. Not relevant.
- **Logs** — the job repeatedly failed a TLS handshake with
  `x509: certificate has expired or is not yet valid`. Relevant.
- **Tickets** — one ticket links to `auth-gateway`, but it's closed and
  unrelated. Not relevant.

**Expected synthesis:** medium confidence (not high) — the system is honest
that it only found one piece of correlated evidence, not four. Suggested
action is "investigate directly," not "escalate ticket X," because there
isn't one yet. This new incident also gets written to memory, so a repeat
failure would now hit instant recall too.

## Why this shape

- Proves the "hours -> seconds" claim twice, at two different speeds in Act
  1/2 (full multi-agent investigation vs. instant recall).
- Turns "institutional memory" into a story with a point: the system surfaces
  an organizational failure (a known risk that got ignored) that a human
  doing manual 2am triage would likely miss.
- Act 3 proves the system isn't scripted to always find a tidy four-system
  story — sometimes the honest answer is "medium confidence, investigate
  further," which is more credible than every demo ending in a perfect
  ticket match.
- Natural closer for the demo video: "same problem, caught instantly the
  second time — that's the compounding value of institutional memory. And
  when it's something genuinely new, it says so instead of forcing a story."
