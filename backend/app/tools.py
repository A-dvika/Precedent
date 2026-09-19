"""Read-only connectors over the simulated enterprise dataset.

Each function stands in for a real API call (Autosys, GitLab, Grafana, Jira).
Swap the JSON reads for real HTTP calls once wiring up live systems — the
specialist/orchestrator layer only depends on these function signatures.
"""

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

DATA_DIR = Path(__file__).parent / "data"


def _load(name: str):
    with open(DATA_DIR / name, encoding="utf-8") as f:
        return json.load(f)


def get_job_run(job_name: str, before: Optional[str] = None) -> Optional[dict]:
    """Most recent run of `job_name` at or before `before` (ISO timestamp)."""
    jobs = [j for j in _load("jobs.json") if j["job_name"] == job_name]
    if before:
        cutoff = datetime.fromisoformat(before.replace("Z", "+00:00"))
        jobs = [j for j in jobs if datetime.fromisoformat(j["start_time"].replace("Z", "+00:00")) <= cutoff]
    if not jobs:
        return None
    return sorted(jobs, key=lambda j: j["start_time"])[-1]


def get_deploys(since: str, until: str) -> list[dict]:
    """Deploys in the [since, until] ISO-timestamp window."""
    start = datetime.fromisoformat(since.replace("Z", "+00:00"))
    end = datetime.fromisoformat(until.replace("Z", "+00:00"))
    out = []
    for d in _load("deploys.json"):
        ts = datetime.fromisoformat(d["deployed_at"].replace("Z", "+00:00"))
        if start <= ts <= end:
            out.append(d)
    return out


def get_metrics(service: str, since: str, until: str) -> Optional[dict]:
    """Latency series for `service` in the [since, until] window, plus baseline."""
    data = _load("metrics.json").get(service)
    if not data:
        return None
    start = datetime.fromisoformat(since.replace("Z", "+00:00"))
    end = datetime.fromisoformat(until.replace("Z", "+00:00"))
    series = [
        p for p in data["series"]
        if start <= datetime.fromisoformat(p["ts"].replace("Z", "+00:00")) <= end
    ]
    return {"service": service, "baseline_ms": data["baseline_ms"], "series": series}


def get_logs(run_id: str) -> list[str]:
    return _load("logs.json").get(run_id, [])


def get_tickets(linked_service: Optional[str] = None, status: Optional[str] = None) -> list[dict]:
    tickets = _load("tickets.json")
    if linked_service:
        tickets = [t for t in tickets if t["linked_service"] == linked_service]
    if status:
        tickets = [t for t in tickets if t["status"] == status]
    return tickets


def window_around(iso_ts: str, minutes_before: int = 60, minutes_after: int = 5) -> tuple[str, str]:
    ts = datetime.fromisoformat(iso_ts.replace("Z", "+00:00"))
    since = (ts - timedelta(minutes=minutes_before)).isoformat().replace("+00:00", "Z")
    until = (ts + timedelta(minutes=minutes_after)).isoformat().replace("+00:00", "Z")
    return since, until
