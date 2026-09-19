export default function ChatPanel({
  question,
  setQuestion,
  jobName,
  setJobName,
  onSubmit,
  busy,
  result,
  errorMessage,
  hoveredFinding,
}) {
  return (
    <div className="chat-panel">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <label>
          Question
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Why did the overnight job fail?"
          />
        </label>
        <label>
          Job
          <select value={jobName} onChange={(e) => setJobName(e.target.value)}>
            <option value="settlement_batch_job">settlement_batch_job (Act 1)</option>
            <option value="fx_reval_job">fx_reval_job (Act 2)</option>
          </select>
        </label>
        <button type="submit" disabled={busy}>
          {busy ? "Investigating..." : "Investigate"}
        </button>
      </form>

      {hoveredFinding && (
        <div className="finding-tooltip">
          <strong>{hoveredFinding.domain}</strong>
          <p>{hoveredFinding.summary}</p>
        </div>
      )}

      {errorMessage && <div className="error-box">{errorMessage}</div>}

      {result && (
        <div className="result-box">
          {result.memory_hit && (
            <div className="memory-badge">
              Matched prior incident {result.memory_hit.incident_id}
            </div>
          )}
          <h3>Root cause</h3>
          <p>{result.root_cause}</p>
          <h4>Evidence trail</h4>
          <ul>
            {(result.evidence_trail || []).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
          <h4>Suggested action</h4>
          <p>{result.suggested_action}</p>
          <div className="confidence">Confidence: {result.confidence}</div>
        </div>
      )}
    </div>
  );
}
