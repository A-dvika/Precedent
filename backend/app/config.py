import os
from functools import lru_cache

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()


class Settings:
    nebius_api_key: str = os.environ.get("NEBIUS_API_KEY", "")
    nebius_base_url: str = os.environ.get("NEBIUS_BASE_URL", "https://api.tokenfactory.nebius.com/v1")
    reasoning_model: str = os.environ.get("NEMOTRON_REASONING_MODEL", "nvidia/nemotron-3-ultra")
    fast_model: str = os.environ.get("NEMOTRON_FAST_MODEL", "nvidia/nemotron-3-nano")

    # Demo mode: deterministic, rule-based "findings" instead of real Nemotron
    # calls -- runs offline, with no API key, and never flakes. Auto-enables
    # when there's no API key; set DEMO_MODE=false to force real calls, or
    # DEMO_MODE=true to force mock mode even with a key configured.
    demo_mode: bool = os.environ.get("DEMO_MODE", "").lower() in ("true", "1") or (
        not nebius_api_key and os.environ.get("DEMO_MODE", "").lower() != "false"
    )


settings = Settings()


@lru_cache
def get_client() -> OpenAI:
    return OpenAI(
        api_key=settings.nebius_api_key,
        base_url=settings.nebius_base_url,
        timeout=20.0,
        max_retries=1,
    )
