"""Orchestrator: checks memory first, otherwise dispatches specialists in
parallel and synthesizes their findings with the reasoning-tier model.

Yields event dicts as it goes (for the SSE stream / system-map UI), and
finishes by yielding a single {"type": "done", "result": InvestigateResult}.
"""

import json
from concurrent.futures import ThreadPoolExecutor, as_completed

from . import mock_llm, specialists, tools
from .config import get_client, settings
from .llm_utils import chat_json
from .memory import memory_store
from .schemas import Finding, InvestigateResult, MemoryMatch

_SYNTHESIS_SYSTEM = (
    "You are the lead investigator synthesizing findings from several specialist "
    "agents into a single root-cause answer for an on-call engineer. Only use the "
    "relevant findings provided -- if few or none are relevant, say so plainly and "
    "use medium/low confidence rather than inventing a cause. Respond ONLY as JSON, "
    "no other text: "
    '{"root_cause": "...", "short_summary": "one sentence, under 140 chars", '
    '"evidence_trail": ["...", "..."], '
    '"suggested_action": "...", "confidence": "high|medium|low"}'
)

# Which dependency service each job's specialists should investigate.
# Real system: this would come from a service-ownership/dependency graph.
JOB_TO_SERVICE = {
    "settlement_batch_job": "pricing-service",
    "fx_reval_job": "pricing-service",
    "nightly_auth_sync_job": "auth-gateway",
}
DEFAULT_SERVICE = "pricing-service"


def investigate(question: str, job_name: str):
    job_run = tools.get_job_run(job_name)
    if job_run is None:
        yield {"type": "error", "message": f"no run found for job {job_name}"}
        return

    service = JOB_TO_SERVICE.get(job_name, DEFAULT_SERVICE)

    yield {"type": "memory_check"}
    if settings.demo_mode:
        mock_llm.thinking_delay(0.4, 0.9)
    memory_hit = memory_store.find_match(service, job_run.get("error") or "")
    if memory_hit:
        yield {"type": "memory_hit", "incident_id": memory_hit.incident_id, "summary": memory_hit.summary}
        result = InvestigateResult(
            question=question,
            job_name=job_name,
            memory_hit=MemoryMatch(
                incident_id=memory_hit.incident_id,
                summary=memory_hit.summary,
                root_cause=memory_hit.root_cause,
                ticket_id=memory_hit.ticket_id,
            ),
            root_cause=memory_hit.root_cause,
            evidence_trail=[f"Matched prior incident {memory_hit.incident_id}: {memory_hit.summary}"],
            suggested_action=f"Escalate {memory_hit.ticket_id or 'the linked ticket'} — this is a recurrence.",
            confidence="high",
        )
        yield {"type": "done", "result": result}
        return

    yield {"type": "memory_miss"}

    jobs = {
        "deploys": lambda: specialists.deploy_specialist(job_run),
        "metrics": lambda: specialists.metrics_specialist(job_run, service),
        "logs": lambda: specialists.logs_specialist(job_run),
        "tickets": lambda: specialists.tickets_specialist(service),
    }

    findings: list[Finding] = []
    with ThreadPoolExecutor(max_workers=len(jobs)) as pool:
        futures = {}
        for domain, fn in jobs.items():
            yield {"type": "specialist_start", "domain": domain}
            futures[pool.submit(fn)] = domain
        for future in as_completed(futures):
            domain = futures[future]
            try:
                finding = future.result()
            except Exception as exc:  # noqa: BLE001 - surface any specialist failure to the stream
                yield {"type": "specialist_error", "domain": domain, "message": str(exc)}
                continue
            findings.append(finding)
            yield {"type": "specialist_result", "domain": domain, "finding": finding.model_dump()}

    if not findings:
        yield {"type": "error", "message": "all specialists failed; no findings to synthesize"}
        return

    yield {"type": "synthesizing"}
    try:
        if settings.demo_mode:
            synthesis = mock_llm.mock_synthesis(question, job_run, [f.model_dump() for f in findings])
        else:
            client = get_client()
            messages = [
                {"role": "system", "content": _SYNTHESIS_SYSTEM},
                {
                    "role": "user",
                    "content": json.dumps(
                        {
                            "question": question,
                            "job": job_run,
                            "findings": [f.model_dump() for f in findings],
                        }
                    ),
                },
            ]
            synthesis = chat_json(client, settings.reasoning_model, messages, temperature=0.2)
    except Exception as exc:  # noqa: BLE001 - surface synthesis failure instead of hanging the stream
        yield {"type": "error", "message": f"synthesis failed: {exc}"}
        return

    try:
        result = InvestigateResult(
            question=question,
            job_name=job_name,
            findings=findings,
            root_cause=synthesis["root_cause"],
            evidence_trail=synthesis["evidence_trail"],
            suggested_action=synthesis["suggested_action"],
            confidence=synthesis["confidence"],
        )
    except KeyError as exc:
        yield {"type": "error", "message": f"synthesis response missing expected field: {exc}"}
        return

    relevant_ticket = next((f for f in findings if f.domain == "tickets" and f.relevant), None)
    memory_store.add(
        incident_id=job_run["run_id"],
        job_name=job_name,
        service=service,
        error_text=job_run.get("error") or "",
        summary=synthesis.get("short_summary", synthesis["root_cause"]),
        root_cause=synthesis["root_cause"],
        ticket_id=_extract_ticket_id(relevant_ticket),
    )

    yield {"type": "done", "result": result}


def _extract_ticket_id(finding: Finding | None) -> str | None:
    if not finding:
        return None
    import re

    match = re.search(r"[A-Z]{2,}-\d+", finding.evidence)
    return match.group(0) if match else None
