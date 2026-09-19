from typing import Literal, Optional

from pydantic import BaseModel


class InvestigateRequest(BaseModel):
    question: str
    job_name: str


class Finding(BaseModel):
    domain: Literal["deploys", "metrics", "logs", "tickets"]
    summary: str
    evidence: str
    relevant: bool


class MemoryMatch(BaseModel):
    incident_id: str
    summary: str
    root_cause: str
    ticket_id: Optional[str] = None


class InvestigateResult(BaseModel):
    question: str
    job_name: str
    memory_hit: Optional[MemoryMatch] = None
    findings: list[Finding] = []
    root_cause: Optional[str] = None
    evidence_trail: list[str] = []
    suggested_action: Optional[str] = None
    confidence: Optional[str] = None
