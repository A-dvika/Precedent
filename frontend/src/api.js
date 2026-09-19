const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

/**
 * Streams /investigate as Server-Sent Events. `onEvent` is called once per
 * parsed event object. Returns a promise that resolves when the stream ends.
 */
export async function investigate(question, jobName, onEvent) {
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
