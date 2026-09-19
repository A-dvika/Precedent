"""Deterministic, rule-based stand-ins for the Nemotron calls, used when
DEMO_MODE is on (auto-enabled when there's no API key). These inspect the
same structured tool output a real specialist prompt would receive and
produce the same JSON shape a real model call would -- so swapping in real
Nemotron calls later is a drop-in replacement, not a rewrite.

A small random delay is added so the system-map UI has something to animate;
see `thinking_delay()`.
"""

import random
import re
import time
from datetime import datetime

_TICKET_ID_RE = re.compile(r"^[A-Z]{2,}-\d+")


def thinking_delay(low: float = 0.6, high: float = 1.6) -> None:
    time.sleep(random.uniform(low, high))


def _minutes_between(a: str, b: str) -> int:
    ta = datetime.fromisoformat(a.replace("Z", "+00:00"))
    tb = datetime.fromisoformat(b.replace("Z", "+00:00"))
    return int(abs((tb - ta).total_seconds()) // 60)


def mock_deploy_finding(job: dict, deploys: list[dict]) -> dict:
    thinking_delay()
    if not deploys:
        return {
            "relevant": False,
            "summary": "No deploys found in the lookback window before this run.",
            "evidence": "no matching deploys",
        }
    d = deploys[0]
    mins = _minutes_between(d["deployed_at"], job["start_time"])
    return {
        "relevant": True,
        "summary": (
            f"{d['repo']} v{d['version']} deployed to {d['target_service']} "
            f"at {d['deployed_at']}, {mins} minutes before this run started."
        ),
        "evidence": f"deploy {d['repo']}@{d['version']} -> {d['target_service']} at {d['deployed_at']}",
    }


def mock_metrics_finding(job: dict, metrics: dict | None) -> dict:
    thinking_delay()
    if not metrics or not metrics.get("series"):
        return {"relevant": False, "summary": "No metrics available for this window.", "evidence": "no data"}
    baseline = metrics["baseline_ms"]
    peak = max(p["value"] for p in metrics["series"])
    if peak < baseline * 3:
        return {
            "relevant": False,
            "summary": f"{metrics['service']} latency stayed near baseline (~{baseline}ms).",
            "evidence": f"peak {peak}ms vs baseline {baseline}ms",
        }
    spike_point = next(p for p in metrics["series"] if p["value"] == peak)
    return {
        "relevant": True,
        "summary": (
            f"{metrics['service']} p99 latency spiked from a {baseline}ms baseline to "
            f"{peak}ms around {spike_point['ts']} -- roughly {round(peak / baseline)}x normal."
        ),
        "evidence": f"{metrics['service']} p99 {baseline}ms -> {peak}ms at {spike_point['ts']}",
    }


def mock_logs_finding(job: dict, logs: list[str]) -> dict:
    thinking_delay()
    if job.get("status") != "FAILED" or not logs:
        return {"relevant": False, "summary": "No failure signal in the logs.", "evidence": "job succeeded"}
    error_lines = [l for l in logs if "ERROR" in l]
    retry_count = sum(1 for l in error_lines if "retrying" in l)
    is_timeout = bool(re.search(r"timeout", job.get("error") or "", re.I)) or any(
        re.search(r"timeout|slow response", l, re.I) for l in logs
    )
    called_service = None
    for l in logs:
        if "calling" in l:
            called_service = l.split("calling", 1)[1].strip().split(" ")[0].rstrip(".")
            break
    behavior = "hit slow responses and timed out" if is_timeout else "hit repeated errors"
    return {
        "relevant": True,
        "summary": (
            f"Job repeatedly called {called_service or 'a dependency'}, {behavior}, "
            f"retried {retry_count} time(s), then failed: {job.get('error')}"
        ),
        "evidence": f"{len(error_lines)} error lines, final: {error_lines[-1] if error_lines else job.get('error')}",
    }


def mock_tickets_finding(service: str, tickets: list[dict]) -> dict:
    thinking_delay()
    open_tickets = [t for t in tickets if t.get("status") == "Open"]
    if not open_tickets:
        return {
            "relevant": False,
            "summary": f"No open tickets linked to {service}.",
            "evidence": "no open tickets",
        }
    t = open_tickets[0]
    return {
        "relevant": True,
        "summary": (
            f"{t['ticket_id']} (open, {t['priority']}): \"{t['title']}\" -- filed {t['created_at']}. "
            f"{t['description']}"
        ),
        "evidence": f"{t['ticket_id']}: {t['title']}",
    }


def mock_synthesis(question: str, job: dict, findings: list[dict]) -> dict:
    thinking_delay(0.8, 1.8)
    relevant = [f for f in findings if f["relevant"]]

    deploy = next((f for f in relevant if "deployed to" in f["summary"]), None)
    metrics = next((f for f in relevant if "latency spiked" in f["summary"]), None)
    logs = next((f for f in relevant if "repeatedly called" in f["summary"]), None)
    ticket = next((f for f in relevant if _TICKET_ID_RE.match(f["evidence"])), None)

    if deploy and metrics and logs:
        story = (
            f"{job['job_name']} didn't fail on its own. {deploy['summary']} "
            f"Right after, {metrics['summary']} {logs['summary']}"
        )
        if ticket:
            story += f" This regression was already known: {ticket['summary']}"
        confidence = "high" if ticket else "medium"
        action = (
            f"Escalate {ticket['evidence'].split(':')[0]} to blocking priority and roll back or patch the "
            f"regression -- this is a known, unresolved issue causing production failures."
            if ticket
            else "Roll back the recent deploy to the affected service and investigate the latency regression."
        )
    elif logs:
        story = f"{job['job_name']} failed: {logs['summary']}"
        confidence = "medium"
        action = "Investigate the dependency service directly; no clear upstream cause found in deploys/metrics."
    else:
        story = f"{job['job_name']} run {job['run_id']} status: {job.get('status')}. No strong signal found."
        confidence = "low"
        action = "Manual investigation recommended -- specialists found no clear correlated evidence."

    evidence_trail = [f["evidence"] for f in relevant]

    if ticket:
        short_summary = f"{job['job_name']} failure traced to {ticket['evidence'].split(':')[0]} (known regression)."
    elif deploy:
        short_summary = f"{job['job_name']} failure traced to a recent deploy to {deploy['evidence'].split('->')[1].split(' at')[0].strip()}."
    else:
        short_summary = story[:140] + ("..." if len(story) > 140 else "")

    return {
        "root_cause": story,
        "short_summary": short_summary,
        "evidence_trail": evidence_trail,
        "suggested_action": action,
        "confidence": confidence,
    }
