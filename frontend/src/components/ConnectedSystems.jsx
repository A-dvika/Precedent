const SYSTEMS = [
  { name: "Autosys", role: "job scheduler", connected: true },
  { name: "GitLab", role: "deploy history", connected: true },
  { name: "Grafana", role: "metrics", connected: true },
  { name: "Jira", role: "ticketing", connected: true },
  { name: "PagerDuty", role: "on-call", connected: false },
  { name: "Slack", role: "comms", connected: false },
];

export default function ConnectedSystems() {
  return (
    <div className="connected-systems">
      {SYSTEMS.map((s) => (
        <div key={s.name} className={`system-chip ${s.connected ? "system-chip--on" : "system-chip--off"}`}>
          <span className="system-chip-dot" />
          <span className="system-chip-name">{s.name}</span>
          <span className="system-chip-role">{s.role}</span>
        </div>
      ))}
    </div>
  );
}
