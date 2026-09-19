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
};

/** Pure reducer: (state, SSE event) -> next state. Kept separate from React
 * so the event-handling logic can be tested without a browser. */
export function reduceEvent(state, event) {
  switch (event.type) {
    case "__reset__":
      return INITIAL_STATE;
    case "memory_check":
      return { ...state, nodeStatus: { ...state.nodeStatus, memory: "active" } };
    case "memory_hit":
      return {
        ...state,
        nodeStatus: { ...state.nodeStatus, memory: "hit", answer: "done" },
        edges: [{ from: "memory", to: "answer" }],
      };
    case "memory_miss":
      return { ...state, nodeStatus: { ...state.nodeStatus, memory: "miss" } };
    case "specialist_start":
      return { ...state, nodeStatus: { ...state.nodeStatus, [event.domain]: "active" } };
    case "specialist_result": {
      const status = event.finding.relevant ? "relevant" : "irrelevant";
      const nextEdges = event.finding.relevant
        ? [...state.edges, { from: event.domain, to: "answer" }]
        : state.edges;
      return {
        ...state,
        nodeStatus: { ...state.nodeStatus, [event.domain]: status },
        findings: { ...state.findings, [event.domain]: event.finding },
        edges: nextEdges,
      };
    }
    case "specialist_error":
      return { ...state, nodeStatus: { ...state.nodeStatus, [event.domain]: "error" } };
    case "synthesizing":
      return { ...state, nodeStatus: { ...state.nodeStatus, answer: "active" } };
    case "done":
      return { ...state, nodeStatus: { ...state.nodeStatus, answer: "done" }, result: event.result };
    case "error":
      return { ...state, errorMessage: event.message };
    default:
      return state;
  }
}
