import { useReducer, useRef, useState } from "react";
import SystemMap from "./components/SystemMap";
import ChatPanel from "./components/ChatPanel";
import ActivityLog from "./components/ActivityLog";
import { investigate } from "./api";
import { reduceEvent, INITIAL_STATE } from "./reducer";
import "./App.css";

function App() {
  const [question, setQuestion] = useState("Why did the overnight settlement job fail?");
  const [jobName, setJobName] = useState("settlement_batch_job");
  const [busy, setBusy] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(null);
  const [state, dispatch] = useReducer(reduceEvent, INITIAL_STATE);
  const { nodeStatus, edges, findings, result, errorMessage, log } = state;
  const startRef = useRef(null);

  async function runInvestigation(q, job) {
    setBusy(true);
    setElapsedMs(null);
    dispatch({ type: "__reset__" });
    startRef.current = performance.now();
    await investigate(q, job, (event) => {
      dispatch(event);
      if (event.type === "done" || event.type === "memory_hit") {
        setElapsedMs(performance.now() - startRef.current);
      }
    });
    setBusy(false);
  }

  function handleScenario(scenario) {
    setQuestion(scenario.question);
    setJobName(scenario.job);
    runInvestigation(scenario.question, scenario.job);
  }

  const hoveredFinding = hoveredNode ? findings[hoveredNode] : null;

  return (
    <div className="app-shell">
      <header>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26">
              <path
                d="M12 2 L21 6.5 V13 C21 18 17 21.5 12 23 C7 21.5 3 18 3 13 V6.5 Z"
                fill="none"
                stroke="#a98bff"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path d="M8.5 12.5 L11 15 L16 9" fill="none" stroke="#3ddc8c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <h1>Precedent</h1>
            <p className="subtitle">Cross-system incident investigator with institutional memory.</p>
          </div>
        </div>
        <div className="powered-by">Nemotron on Nebius Token Factory</div>
      </header>
      <main>
        <div className="map-column">
          <div className="panel map-panel">
            <SystemMap nodeStatus={nodeStatus} edges={edges} findings={findings} onHoverNode={setHoveredNode} />
          </div>
          <ActivityLog log={log} />
        </div>
        <ChatPanel
          question={question}
          setQuestion={setQuestion}
          jobName={jobName}
          setJobName={setJobName}
          onSubmit={() => runInvestigation(question, jobName)}
          onScenario={handleScenario}
          busy={busy}
          result={result}
          errorMessage={errorMessage}
          hoveredFinding={hoveredFinding}
          elapsedMs={elapsedMs}
        />
      </main>
    </div>
  );
}

export default App;
