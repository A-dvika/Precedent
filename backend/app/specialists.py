"""Specialist agents: one per tool-domain, each turns raw tool output into a
structured Finding using the fast Nemotron model (Nano/Super tier).
"""

import json

from . import tools
from .config import get_client, settings
from .schemas import Finding

_SYSTEM = (
    "You are a specialist investigator for the {domain} system. "
    "Given raw data, decide whether it is relevant to the incident and summarize "
    "what it shows in 1-2 sentences. Respond ONLY as JSON: "
    '{{"relevant": true|false, "summary": "...", "evidence": "..."}}'
)


def _ask(domain: str, raw_data: str) -> dict:
    client = get_client()
    resp = client.chat.completions.create(
        model=settings.fast_model,
        messages=[
            {"role": "system", "content": _SYSTEM.format(domain=domain)},
            {"role": "user", "content": raw_data},
        ],
        temperature=0.1,
        response_format={"type": "json_object"},
    )
    return json.loads(resp.choices[0].message.content)


def deploy_specialist(job_run: dict) -> Finding:
    since, until = tools.window_around(job_run["start_time"], minutes_before=90)
    deploys = tools.get_deploys(since, until)
    result = _ask("deploy history", json.dumps({"job": job_run, "deploys_in_window": deploys}))
    return Finding(domain="deploys", **result)


def metrics_specialist(job_run: dict, service: str = "pricing-service") -> Finding:
    since, until = tools.window_around(job_run["start_time"], minutes_before=45, minutes_after=10)
    metrics = tools.get_metrics(service, since, until)
    result = _ask("service latency metrics", json.dumps({"job": job_run, "metrics": metrics}))
    return Finding(domain="metrics", **result)


def logs_specialist(job_run: dict) -> Finding:
    logs = tools.get_logs(job_run["run_id"])
    result = _ask("job execution logs", json.dumps({"job": job_run, "logs": logs}))
    return Finding(domain="logs", **result)


def tickets_specialist(service: str = "pricing-service") -> Finding:
    tickets = tools.get_tickets(linked_service=service)
    result = _ask("ticketing system", json.dumps({"service": service, "tickets": tickets}))
    return Finding(domain="tickets", **result)
