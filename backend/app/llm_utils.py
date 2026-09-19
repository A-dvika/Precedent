"""Shared helpers for calling the real Nemotron API robustly.

Not every OpenAI-compatible provider supports `response_format:
json_object` the same way, and models don't always return clean JSON even
when asked to -- they sometimes wrap it in a markdown code fence or add a
stray sentence. These helpers make the real-call path tolerant of that
instead of crashing the investigation on a formatting quirk.
"""

import json
import re

from openai import AuthenticationError, BadRequestError, NotFoundError

_CODE_FENCE_RE = re.compile(r"```(?:json)?\s*(\{.*?\})\s*```", re.DOTALL)
_BRACE_BLOCK_RE = re.compile(r"\{.*\}", re.DOTALL)


def parse_json_response(content: str) -> dict:
    """Best-effort JSON parse of a model response: try as-is, then a
    ```json fenced block, then the first {...} block in the text."""
    if content is None:
        raise ValueError("model returned an empty response")
    content = content.strip()
    for candidate in (content, *_extract_candidates(content)):
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            continue
    raise ValueError(f"model did not return valid JSON: {content[:200]!r}")


def _extract_candidates(content: str):
    fence_match = _CODE_FENCE_RE.search(content)
    if fence_match:
        yield fence_match.group(1)
    brace_match = _BRACE_BLOCK_RE.search(content)
    if brace_match:
        yield brace_match.group(0)


def chat_json(client, model: str, messages: list[dict], temperature: float = 0.1) -> dict:
    """Chat completion expected to return one JSON object. Tries structured
    JSON mode first; if the provider rejects that parameter, retries plain
    (the system prompts already instruct JSON-only output). Raises
    RuntimeError with an actionable message for common failure modes."""
    try:
        resp = _create(client, model, messages, temperature, json_mode=True)
    except BadRequestError as exc:
        if "response_format" in str(exc).lower() or "json_object" in str(exc).lower():
            resp = _create(client, model, messages, temperature, json_mode=False)
        else:
            raise RuntimeError(f"request to model '{model}' was rejected: {exc}") from exc
    except AuthenticationError as exc:
        raise RuntimeError(
            "Nebius API authentication failed -- check NEBIUS_API_KEY in backend/.env"
        ) from exc
    except NotFoundError as exc:
        raise RuntimeError(
            f"model '{model}' not found -- check NEMOTRON_FAST_MODEL / "
            f"NEMOTRON_REASONING_MODEL against the Token Factory console"
        ) from exc

    return parse_json_response(resp.choices[0].message.content)


def _create(client, model: str, messages: list[dict], temperature: float, json_mode: bool):
    kwargs = {}
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}
    return client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        **kwargs,
    )
