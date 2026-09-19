const LAYOUT = {
  memory: { x: 250, y: 40, label: "Memory" },
  deploys: { x: 60, y: 160, label: "Deploys" },
  metrics: { x: 440, y: 160, label: "Metrics" },
  logs: { x: 60, y: 300, label: "Logs" },
  tickets: { x: 440, y: 300, label: "Tickets" },
  answer: { x: 250, y: 380, label: "Answer" },
};

const STATUS_COLOR = {
  idle: "#3a3f4b",
  active: "#f5a623",
  hit: "#7c5cff",
  miss: "#3a3f4b",
  relevant: "#3dd68c",
  irrelevant: "#5a6072",
  error: "#e5484d",
  done: "#7c5cff",
};

function Node({ id, status, onHover }) {
  const { x, y, label } = LAYOUT[id];
  const color = STATUS_COLOR[status] || STATUS_COLOR.idle;
  const pulsing = status === "active";
  return (
    <g
      transform={`translate(${x},${y})`}
      onMouseEnter={() => onHover?.(id)}
      onMouseLeave={() => onHover?.(null)}
      style={{ cursor: "default" }}
    >
      {pulsing && (
        <circle r="26" fill={color} opacity="0.35">
          <animate attributeName="r" values="22;34;22" dur="1.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0;0.35" dur="1.4s" repeatCount="indefinite" />
        </circle>
      )}
      <circle r="22" fill={color} stroke="#1a1d24" strokeWidth="2" />
      <text y="42" textAnchor="middle" fontSize="13" fill="#d7dae0" fontFamily="system-ui, sans-serif">
        {label}
      </text>
    </g>
  );
}

export default function SystemMap({ nodeStatus, edges, onHoverNode }) {
  return (
    <svg viewBox="0 0 500 420" width="100%" height="420" role="img" aria-label="system map">
      <rect x="0" y="0" width="500" height="420" fill="#12141a" rx="12" />
      {edges.map((e, i) => {
        const from = LAYOUT[e.from];
        const to = LAYOUT[e.to];
        if (!from || !to) return null;
        return (
          <line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="#7c5cff"
            strokeWidth="2"
            strokeDasharray="4 3"
            opacity="0.8"
          />
        );
      })}
      {Object.keys(LAYOUT).map((id) => (
        <Node key={id} id={id} status={nodeStatus[id] || "idle"} onHover={onHoverNode} />
      ))}
    </svg>
  );
}
