/**
 * JS port of backend/app/memory.py -- same keyword-signature overlap
 * matching, module-level singleton (resets on page reload, same as the
 * Python backend resetting on server restart).
 */

function terms(...texts) {
  const joined = texts.join(" ").toLowerCase();
  return new Set(joined.match(/[a-z][a-z0-9_\-.]{2,}/g) || []);
}

class MemoryStore {
  constructor() {
    this.entries = [];
  }

  findMatch(service, errorText, minOverlap = 3) {
    const queryTerms = terms(service, errorText);
    let best = null;
    let bestScore = 0;
    for (const entry of this.entries) {
      let score = 0;
      for (const t of queryTerms) if (entry.signatureTerms.has(t)) score++;
      if (score > bestScore) {
        best = entry;
        bestScore = score;
      }
    }
    return bestScore >= minOverlap ? best : null;
  }

  add({ incidentId, jobName, service, errorText, summary, rootCause, ticketId }) {
    const entry = {
      incidentId,
      jobName,
      service,
      signatureTerms: terms(service, errorText),
      summary,
      rootCause,
      ticketId: ticketId ?? null,
    };
    this.entries.push(entry);
    return entry;
  }
}

export const memoryStore = new MemoryStore();
