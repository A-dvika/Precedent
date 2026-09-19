import { investigateLocal } from "./local/orchestrator";

const API_BASE = import.meta.env.VITE_API_BASE || "";

/**
 * Runs an investigation and streams events to `onEvent`, one per SSE/local
 * event. With no VITE_API_BASE configured (the default -- and what the
 * standalone Vercel deploy uses), this runs entirely client-side via the
 * local orchestrator, so there's no backend to host at all. Set
 * VITE_API_BASE to drive the UI from the real Python backend instead --
 * same event shapes either way, so the rest of the app doesn't change.
 */
export async function investigate(question, jobName, onEvent) {
  if (!API_BASE) {
    return investigateLocal(question, jobName, onEvent);
  }
  return investigateRemote(question, jobName, onEvent);
}

async function investigateRemote(question, jobName, onEvent) {
  const res = await fetch(`${API_BASE}/investigate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, job_name: jobName }),
  });

  if (!res.ok || !res.body) {
    onEvent({ type: "error", message: `request failed: ${res.status}` });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const line = chunk.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      const jsonStr = line.slice("data:".length).trim();
      if (!jsonStr) continue;
      try {
        onEvent(JSON.parse(jsonStr));
      } catch {
        // ignore malformed chunk
      }
    }
  }
}
