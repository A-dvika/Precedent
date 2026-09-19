const MANUAL_BASELINE_MINUTES = 150; // illustrative: typical multi-tool manual triage time

export default function StatsBar({ history }) {
  const total = history.length;
  const recalls = history.filter((h) => h.wasRecall).length;
  const savedMinutes = total * MANUAL_BASELINE_MINUTES;
  const savedHours = (savedMinutes / 60).toFixed(1);

  return (
    <div className="stats-bar">
      <div className="stat">
        <span className="stat-value">{total}</span>
        <span className="stat-label">Investigations</span>
      </div>
      <div className="stat">
        <span className="stat-value">{recalls}</span>
        <span className="stat-label">Instant recalls</span>
      </div>
      <div className="stat stat--highlight">
        <span className="stat-value">~{savedHours}h</span>
        <span className="stat-label">Est. time saved*</span>
      </div>
      <div className="stat-footnote">*vs. a ~2.5h manual multi-tool investigation baseline</div>
    </div>
  );
}
