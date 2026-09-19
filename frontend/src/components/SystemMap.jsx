const LAYOUT = {
  memory: { x: 300, y: 50, label: "Memory" },
  deploys: { x: 90, y: 195, label: "Deploys" },
  metrics: { x: 510, y: 195, label: "Metrics" },
  logs: { x: 90, y: 345, label: "Logs" },
  tickets: { x: 510, y: 345, label: "Tickets" },
  answer: { x: 300, y: 460, label: "Answer" },
};

const VIEWBOX_H = 530;

const STATUS_STYLE = {
  idle: { fill: "#20242e", ring: "#2e3340", glow: null },
  active: { fill: "#3a2f14", ring: "#f5a623", glow: "#f5a623" },
  hit: { fill: "#2a1e4a", ring: "#a98bff", glow: "#a98bff" },
  miss: { fill: "#20242e", ring: "#3a3f4c", glow: null },
  relevant: { fill: "#123023", ring: "#3ddc8c", glow: "#3ddc8c" },
  irrelevant: { fill: "#20242e", ring: "#3a3f4c", glow: null },
  error: { fill: "#341418", ring: "#e5484d", glow: "#e5484d" },
  done: { fill: "#2a1e4a", ring: "#a98bff", glow: "#a98bff" },
};

const ICONS = {
  memory: (
    <path d="M-8,-3 a8,8 0 1 1 16,0 v6 a3,3 0 0 1 -3,3 h-10 a3,3 0 0 1 -3,-3 z M-4,-3 a4,4 0 1 1 8,0" />
  ),
  deploys: <path d="M-8,6 L0,-8 L8,6 Z M-8,6 L8,6" />,
  metrics: <path d="M-9,7 L-9,1 L-3,1 L-3,-3 L3,-3 L3,4 L9,4 L9,7 Z" />,
  logs: <path d="M-7,-9 h14 v18 h-14 z M-4,-4 h8 M-4,0 h8 M-4,4 h5" />,
  tickets: <path d="M-9,-5 h18 a2,2 0 0 1 0,10 h-18 a2,2 0 0 1 0,-10 Z M0,-5 v10" />,
  answer: <path d="M0,-9 L2.4,-2.8 L9,-2.8 L3.6,1.4 L5.6,8 L0,4 L-5.6,8 L-3.6,1.4 L-9,-2.8 L-2.4,-2.8 Z" />,
};

function edgePath(from, to) {
  const midY = (from.y + to.y) / 2;
  return `M${from.x},${from.y} C${from.x},${midY} ${to.x},${midY} ${to.x},${to.y}`;
}

function Node({ id, status, finding, onHover }) {
  const { x, y, label } = LAYOUT[id];
  const style = STATUS_STYLE[status] || STATUS_STYLE.idle;
  const pulsing = status === "active";
  const radius = id === "answer" ? 28 : 24;

  return (
    <g
      transform={`translate(${x},${y})`}
      onMouseEnter={() => onHover?.(id)}
      onMouseLeave={() => onHover?.(null)}
      style={{ cursor: finding ? "help" : "default" }}
    >
      {pulsing && (
        <circle r={radius} fill={style.glow} opacity="0.3">
          <animate attributeName="r" values={`${radius};${radius + 14};${radius}`} dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
      {style.glow && !pulsing && (
        <circle r={radius + 4} fill="none" stroke={style.glow} strokeWidth="1" opacity="0.35" />
      )}
      <circle r={radius} fill={style.fill} stroke={style.ring} strokeWidth="2" />
      <g stroke={style.ring} strokeWidth="1.6" fill="none" strokeLinejoin="round" strokeLinecap="round">
        {ICONS[id]}
      </g>
      <text y={radius + 20} textAnchor="middle" fontSize="13" fontWeight="600" fill="#c7cbd4" fontFamily="Inter, system-ui, sans-serif">
        {label}
      </text>
    </g>
  );
}

export default function SystemMap({ nodeStatus, edges, findings, onHoverNode }) {
  return (
    <svg viewBox={`0 0 600 ${VIEWBOX_H}`} width="100%" height="100%" role="img" aria-label="system map">
      <defs>
        <linearGradient id="edgeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3ddc8c" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#a98bff" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="600" height={VIEWBOX_H} fill="#0f1117" rx="16" />
      {edges.map((e, i) => {
        const from = LAYOUT[e.from];
        const to = LAYOUT[e.to];
        if (!from || !to) return null;
        return (
          <path
            key={i}
            d={edgePath(from, to)}
            fill="none"
            stroke="url(#edgeGrad)"
            strokeWidth="2.5"
            strokeDasharray="6 5"
            opacity="0.9"
          >
            <animate attributeName="stroke-dashoffset" from="22" to="0" dur="0.8s" repeatCount="indefinite" />
          </path>
        );
      })}
      {Object.keys(LAYOUT).map((id) => (
        <Node
          key={id}
          id={id}
          status={nodeStatus[id] || "idle"}
          finding={findings[id]}
          onHover={onHoverNode}
        />
      ))}
    </svg>
  );
}
