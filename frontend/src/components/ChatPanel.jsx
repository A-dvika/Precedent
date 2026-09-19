const SCENARIOS = [
  {
    id: "act1",
    job: "settlement_batch_job",
    question: "Why did the overnight settlement job fail?",
    label: "Act 1 — Settlement job failure",
    hint: "Full investigation across 4 systems",
  },
  {
    id: "act2",
    job: "fx_reval_job",
    question: "Why did the FX reval job fail?",
    label: "Act 2 — FX reval job (run after Act 1)",
    hint: "Should hit institutional memory instantly",
  },
  {
    id: "act3",
    job: "nightly_auth_sync_job",
    question: "Why did the nightly auth sync job fail?",
    label: "Act 3 — Auth sync job (new, unrelated)",
    hint: "A genuinely new issue — no ticket, lower confidence",
  },
];

const CONFIDENCE_COLOR = {
  high: "#3ddc8c",
  medium: "#f5a623",
  low: "#ff8489",
};

function ElapsedBadge({ elapsedMs, memoryHit }) {
  if (elapsedMs == null) return null;
  const seconds = (elapsedMs / 1000).toFixed(1);
  return (
    <div className={`elapsed-badge ${memoryHit ? "elapsed-badge--instant" : ""}`}>
      {memoryHit ? "⚡ Instant recall" : "Investigated"} in <strong>{seconds}s</strong>
    </div>
  );
}

export default function ChatPanel({
  question,
  setQuestion,
  jobName,
  setJobName,
  onSubmit,
  onScenario,
  busy,
  result,
  errorMessage,
  hoveredFinding,
  elapsedMs,
}) {
  return (
    <div className="chat-panel">
      <div className="scenario-row">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`scenario-btn ${jobName === s.job ? "scenario-btn--active" : ""}`}
            disabled={busy}
            onClick={() => onScenario(s)}
          >
            <span className="scenario-label">{s.label}</span>
            <span className="scenario-hint">{s.hint}</span>
          </button>
        ))}
      </div>

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
            <option value="settlement_batch_job">settlement_batch_job</option>
            <option value="fx_reval_job">fx_reval_job</option>
            <option value="nightly_auth_sync_job">nightly_auth_sync_job</option>
          </select>
        </label>
        <button type="submit" className="investigate-btn" disabled={busy}>
          {busy ? "Investigating…" : "Investigate"}
        </button>
      </form>

      {hoveredFinding && (
        <div className="finding-tooltip">
          <strong>{hoveredFinding.domain}</strong>
          <p>{hoveredFinding.summary}</p>
        </div>
      )}

      {errorMessage && <div className="error-box">{errorMessage}</div>}

      {!result && !errorMessage && !busy && (
        <div className="empty-state">
          Pick a scenario above, or ask your own question about one of the
          seeded jobs, to see Precedent investigate.
        </div>
      )}

      {result && (
        <div className="result-box">
          <div className="result-header">
            {result.memory_hit ? (
              <div className="memory-badge">Matched prior incident {result.memory_hit.incident_id}</div>
            ) : (
              result.findings?.length > 0 && (
                <div className="checked-badge">
                  Checked {result.findings.length} systems ·{" "}
                  {result.findings.filter((f) => f.relevant).length} relevant
                </div>
              )
            )}
            <ElapsedBadge elapsedMs={elapsedMs} memoryHit={!!result.memory_hit} />
          </div>

          <h3>Root cause</h3>
          <p className="root-cause-text">{result.root_cause}</p>

          <h4>Evidence trail</h4>
          <ol className="evidence-trail">
            {(result.evidence_trail || []).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ol>

          <div className="action-box">
            <h4>Suggested action</h4>
            <p>{result.suggested_action}</p>
          </div>

          <div className="confidence" style={{ color: CONFIDENCE_COLOR[result.confidence] || "#9aa0ae" }}>
            <span className="confidence-dot" style={{ background: CONFIDENCE_COLOR[result.confidence] || "#9aa0ae" }} />
            Confidence: {result.confidence}
          </div>
        </div>
      )}
    </div>
  );
}
