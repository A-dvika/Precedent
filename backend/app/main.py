import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from .config import settings, validate_settings
from .orchestrator import investigate
from .schemas import InvestigateRequest

validate_settings()

app = FastAPI(title="Precedent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "mode": "demo" if settings.demo_mode else "live",
        "reasoning_model": settings.reasoning_model if not settings.demo_mode else None,
        "fast_model": settings.fast_model if not settings.demo_mode else None,
    }


@app.post("/investigate")
def investigate_stream(req: InvestigateRequest):
    def event_gen():
        for event in investigate(req.question, req.job_name):
            payload = dict(event)
            if "result" in payload:
                payload["result"] = payload["result"].model_dump()
            if "finding" in payload and hasattr(payload["finding"], "model_dump"):
                payload["finding"] = payload["finding"].model_dump()
            yield json.dumps(payload)

    return EventSourceResponse(event_gen())
