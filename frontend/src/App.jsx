import { useReducer, useState } from "react";
import SystemMap from "./components/SystemMap";
import ChatPanel from "./components/ChatPanel";
import { investigate } from "./api";
import { reduceEvent, INITIAL_STATE } from "./reducer";
import "./App.css";

function App() {
  const [question, setQuestion] = useState("Why did the overnight settlement job fail?");
  const [jobName, setJobName] = useState("settlement_batch_job");
  const [busy, setBusy] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [state, dispatch] = useReducer(reduceEvent, INITIAL_STATE);
  const { nodeStatus, edges, findings, result, errorMessage } = state;

  async function handleSubmit() {
    setBusy(true);
    dispatch({ type: "__reset__" });
    await investigate(question, jobName, (event) => dispatch(event));
    setBusy(false);
  }

  const hoveredFinding = hoveredNode ? findings[hoveredNode] : null;

  return (
    <div className="app-shell">
      <header>
        <h1>Cross-System Incident Investigator</h1>
        <p className="subtitle">One question, evidence across every system, in seconds.</p>
      </header>
      <main>
        <SystemMap nodeStatus={nodeStatus} edges={edges} onHoverNode={setHoveredNode} />
        <ChatPanel
          question={question}
          setQuestion={setQuestion}
          jobName={jobName}
          setJobName={setJobName}
          onSubmit={handleSubmit}
          busy={busy}
          result={result}
          errorMessage={errorMessage}
          hoveredFinding={hoveredFinding}
        />
      </main>
    </div>
  );
}

export default App;
