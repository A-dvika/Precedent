import { useEffect, useRef } from "react";

const TONE_COLOR = {
  info: "#8a90a0",
  muted: "#5a6072",
  success: "#3ddc8c",
  error: "#ff8489",
};

export default function ActivityLog({ log }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [log.length]);

  return (
    <div className="activity-log">
      <div className="activity-log-header">Live investigation trace</div>
      <div className="activity-log-body">
        {log.length === 0 && <div className="activity-log-placeholder">Waiting for a question...</div>}
        {log.map((entry, i) => (
          <div key={i} className="activity-log-line" style={{ color: TONE_COLOR[entry.tone] || TONE_COLOR.info }}>
            <span className="activity-log-caret">›</span> {entry.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
