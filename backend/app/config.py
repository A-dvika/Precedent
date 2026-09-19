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


settings = Settings()


@lru_cache
def get_client() -> OpenAI:
    return OpenAI(api_key=settings.nebius_api_key, base_url=settings.nebius_base_url)
