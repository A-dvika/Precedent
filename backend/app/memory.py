"""Institutional memory: has an incident with this signature been seen before?

v1 implementation uses simple keyword-signature overlap so the demo runs with
zero extra infra. Swap `_similarity` for real embeddings (Nemotron embedding
endpoint, if/when available on Token Factory) and back this store with
pgvector on Nebius AI Cloud for production use — the interface stays the same.
"""

import re
from dataclasses import dataclass, field


@dataclass
class MemoryEntry:
    incident_id: str
    job_name: str
    service: str
    signature_terms: set[str]
    summary: str
    root_cause: str
    ticket_id: str | None = None


@dataclass
class MemoryStore:
    entries: list[MemoryEntry] = field(default_factory=list)

    def _terms(self, *texts: str) -> set[str]:
        joined = " ".join(texts).lower()
        return set(re.findall(r"[a-z][a-z0-9_\-\.]{2,}", joined))

    def find_match(self, service: str, error_text: str, min_overlap: int = 3) -> MemoryEntry | None:
        query_terms = self._terms(service, error_text)
        best, best_score = None, 0
        for entry in self.entries:
            score = len(query_terms & entry.signature_terms)
            if score > best_score:
                best, best_score = entry, score
        return best if best_score >= min_overlap else None

    def add(
        self,
        incident_id: str,
        job_name: str,
        service: str,
        error_text: str,
        summary: str,
        root_cause: str,
        ticket_id: str | None = None,
    ) -> MemoryEntry:
        entry = MemoryEntry(
            incident_id=incident_id,
            job_name=job_name,
            service=service,
            signature_terms=self._terms(service, error_text),
            summary=summary,
            root_cause=root_cause,
            ticket_id=ticket_id,
        )
        self.entries.append(entry)
        return entry


memory_store = MemoryStore()
