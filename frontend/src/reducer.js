export const IDLE_STATUS = {
  memory: "idle",
  deploys: "idle",
  metrics: "idle",
  logs: "idle",
  tickets: "idle",
  answer: "idle",
};

export const INITIAL_STATE = {
  nodeStatus: IDLE_STATUS,
  edges: [],
  findings: {},
  result: null,
  errorMessage: null,
  log: [],
};

const DOMAIN_LABEL = {
  deploys: "Deploy history",
  metrics: "Service metrics",
  logs: "Job logs",
  tickets: "Ticketing system",
};

function logLine(state, text, tone = "info") {
  return {
    ...state,
    log: [...state.log, { text, tone, ts: Date.now() }],
  };
}

/** Pure reducer: (state, SSE event) -> next state. Kept separate from React
 * so the event-handling logic can be tested without a browser. */
export function reduceEvent(state, event) {
  switch (event.type) {
    case "__reset__":
      return INITIAL_STATE;

    case "memory_check":
      return logLine(
        { ...state, nodeStatus: { ...state.nodeStatus, memory: "active" } },
        "Checking institutional memory for a matching prior incident..."
      );

    case "memory_hit":
      return logLine(
        {
          ...state,
          nodeStatus: { ...state.nodeStatus, memory: "hit", answer: "done" },
          edges: [{ from: "memory", to: "answer" }],
        },
        `Match found — incident ${event.incident_id}. Skipping full investigation.`,
        "success"
      );

    case "memory_miss":
      return logLine(
        { ...state, nodeStatus: { ...state.nodeStatus, memory: "miss" } },
        "No prior incident found. Dispatching specialists...",
        "muted"
      );

    case "specialist_start":
      return logLine(
        { ...state, nodeStatus: { ...state.nodeStatus, [event.domain]: "active" } },
        `${DOMAIN_LABEL[event.domain] ?? event.domain} — querying...`
      );

    case "specialist_result": {
      const status = event.finding.relevant ? "relevant" : "irrelevant";
      const nextEdges = event.finding.relevant
        ? [...state.edges, { from: event.domain, to: "answer" }]
        : state.edges;
      const withLog = logLine(
        {
          ...state,
          nodeStatus: { ...state.nodeStatus, [event.domain]: status },
          findings: { ...state.findings, [event.domain]: event.finding },
          edges: nextEdges,
        },
        `${DOMAIN_LABEL[event.domain] ?? event.domain} — ${
          event.finding.relevant ? "relevant finding" : "nothing relevant"
        }: ${event.finding.summary}`,
        event.finding.relevant ? "success" : "muted"
      );
      return withLog;
    }

    case "specialist_error":
      return logLine(
        { ...state, nodeStatus: { ...state.nodeStatus, [event.domain]: "error" } },
        `${DOMAIN_LABEL[event.domain] ?? event.domain} — failed: ${event.message}`,
        "error"
      );

    case "synthesizing":
      return logLine(
        { ...state, nodeStatus: { ...state.nodeStatus, answer: "active" } },
        "Synthesizing findings into a root cause..."
      );

    case "done":
      return logLine(
        { ...state, nodeStatus: { ...state.nodeStatus, answer: "done" }, result: event.result },
        "Investigation complete.",
        "success"
      );

    case "error":
      return logLine({ ...state, errorMessage: event.message }, event.message, "error");

    default:
      return state;
  }
}
