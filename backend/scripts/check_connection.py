"""Quick standalone check that NEBIUS_API_KEY / NEBIUS_BASE_URL / model
names are correct, without running a full investigation.

Run this right after adding your Token Factory key to backend/.env:

    cd backend
    python scripts/check_connection.py

Exits 0 and prints [OK] for both models if everything is wired correctly.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import get_client, settings  # noqa: E402


def check_model(client, label: str, model: str) -> bool:
    try:
        resp = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "Reply with exactly one word: OK"}],
            max_tokens=5,
        )
        text = resp.choices[0].message.content
        print(f"[OK]   {label} ({model}) -- responded: {text!r}")
        return True
    except Exception as exc:  # noqa: BLE001 - report any failure, don't crash the script
        print(f"[FAIL] {label} ({model}) -- {exc}")
        return False


def main() -> int:
    if settings.demo_mode:
        print("DEMO_MODE is currently ON (no NEBIUS_API_KEY set in backend/.env).")
        print("Nothing to check -- add your key, then re-run this script.")
        return 0

    print(f"NEBIUS_BASE_URL = {settings.nebius_base_url}")
    print(f"Testing both configured models...\n")

    client = get_client()
    ok_fast = check_model(client, "fast model  ", settings.fast_model)
    ok_reasoning = check_model(client, "reasoning model", settings.reasoning_model)

    print()
    if ok_fast and ok_reasoning:
        print("Both models reachable -- the real Nemotron path is ready.")
        print("Just run `uvicorn app.main:app --reload` and it'll use them automatically.")
        return 0

    print("One or more checks failed. Common fixes:")
    print("  - Double check NEBIUS_API_KEY is correct and not expired")
    print("  - Confirm NEBIUS_BASE_URL matches the Token Factory console")
    print("  - Confirm NEMOTRON_REASONING_MODEL / NEMOTRON_FAST_MODEL match the exact")
    print("    catalog names shown in the Token Factory console (they may differ from")
    print("    the guessed defaults in .env.example)")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
