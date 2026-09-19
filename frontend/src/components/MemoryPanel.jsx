const CONFIDENCE_COLOR = {
  high: "#3ddc8c",
  medium: "#f5a623",
  low: "#ff8489",
};

export default function MemoryPanel({ history }) {
  return (
    <div className="panel memory-panel">
      <div className="panel-header">
        <span>Institutional memory</span>
        <span className="panel-header-count">{history.length}</span>
      </div>
      <div className="memory-panel-body">
        {history.length === 0 && (
          <div className="memory-panel-placeholder">
            No incidents investigated yet. Run a scenario to start building memory.
          </div>
        )}
        {[...history].reverse().map((h) => (
          <div key={h.id} className="memory-entry">
            <div className="memory-entry-top">
              <span className="memory-entry-job">{h.jobName}</span>
              {h.wasRecall && <span className="recall-tag">recall</span>}
            </div>
            <p className="memory-entry-summary">{h.shortSummary}</p>
            <div className="memory-entry-meta">
              <span style={{ color: CONFIDENCE_COLOR[h.confidence] || "#9aa0ae" }}>{h.confidence}</span>
              <span>·</span>
              <span>{(h.elapsedMs / 1000).toFixed(1)}s</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
