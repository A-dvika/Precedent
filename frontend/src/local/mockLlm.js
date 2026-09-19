/**
 * JS port of backend/app/mock_llm.py -- deterministic, rule-based stand-ins
 * for the Nemotron calls. Same input/output shape as the Python version.
 */

const TICKET_ID_RE = /^[A-Z]{2,}-\d+/;

export function thinkingDelay(low = 600, high = 1600) {
  const ms = low + Math.random() * (high - low);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function minutesBetween(a, b) {
  return Math.round(Math.abs(new Date(b).getTime() - new Date(a).getTime()) / 60000);
}

export async function mockDeployFinding(job, deploys) {
  await thinkingDelay();
  if (!deploys.length) {
    return {
      relevant: false,
      summary: "No deploys found in the lookback window before this run.",
      evidence: "no matching deploys",
    };
  }
  const d = deploys[0];
  const mins = minutesBetween(d.deployed_at, job.start_time);
  return {
    relevant: true,
    summary: `${d.repo} v${d.version} deployed to ${d.target_service} at ${d.deployed_at}, ${mins} minutes before this run started.`,
    evidence: `deploy ${d.repo}@${d.version} -> ${d.target_service} at ${d.deployed_at}`,
  };
}

export async function mockMetricsFinding(job, metrics) {
  await thinkingDelay();
  if (!metrics || !metrics.series.length) {
    return { relevant: false, summary: "No metrics available for this window.", evidence: "no data" };
  }
  const baseline = metrics.baseline_ms;
  const peak = Math.max(...metrics.series.map((p) => p.value));
  if (peak < baseline * 3) {
    return {
      relevant: false,
      summary: `${metrics.service} latency stayed near baseline (~${baseline}ms).`,
      evidence: `peak ${peak}ms vs baseline ${baseline}ms`,
    };
  }
  const spikePoint = metrics.series.find((p) => p.value === peak);
  return {
    relevant: true,
    summary: `${metrics.service} p99 latency spiked from a ${baseline}ms baseline to ${peak}ms around ${spikePoint.ts} -- roughly ${Math.round(peak / baseline)}x normal.`,
    evidence: `${metrics.service} p99 ${baseline}ms -> ${peak}ms at ${spikePoint.ts}`,
  };
}

export async function mockLogsFinding(job, logs) {
  await thinkingDelay();
  if (job.status !== "FAILED" || !logs.length) {
    return { relevant: false, summary: "No failure signal in the logs.", evidence: "job succeeded" };
  }
  const errorLines = logs.filter((l) => l.includes("ERROR"));
  const retryCount = errorLines.filter((l) => l.includes("retrying")).length;
  let calledService = null;
  for (const l of logs) {
    if (l.includes("calling")) {
      calledService = l.split("calling")[1].trim().split(" ")[0].replace(/\.$/, "");
      break;
    }
  }
  return {
    relevant: true,
    summary: `Job repeatedly called ${calledService || "a dependency"}, hit slow responses, retried ${retryCount} time(s), then failed: ${job.error}`,
    evidence: `${errorLines.length} error lines, final: ${errorLines.at(-1) || job.error}`,
  };
}

export async function mockTicketsFinding(service, tickets) {
  await thinkingDelay();
  const openTickets = tickets.filter((t) => t.status === "Open");
  if (!openTickets.length) {
    return { relevant: false, summary: `No open tickets linked to ${service}.`, evidence: "no open tickets" };
  }
  const t = openTickets[0];
  return {
    relevant: true,
    summary: `${t.ticket_id} (open, ${t.priority}): "${t.title}" -- filed ${t.created_at}. ${t.description}`,
    evidence: `${t.ticket_id}: ${t.title}`,
  };
}

export async function mockSynthesis(question, job, findings) {
  await thinkingDelay(800, 1800);
  const relevant = findings.filter((f) => f.relevant);

  const deploy = relevant.find((f) => f.summary.includes("deployed to"));
  const metrics = relevant.find((f) => f.summary.includes("latency spiked"));
  const logs = relevant.find((f) => f.summary.includes("repeatedly called"));
  const ticket = relevant.find((f) => TICKET_ID_RE.test(f.evidence));

  let story, confidence, action;
  if (deploy && metrics && logs) {
    story = `${job.job_name} didn't fail on its own. ${deploy.summary} Right after, ${metrics.summary} ${logs.summary}`;
    if (ticket) story += ` This regression was already known: ${ticket.summary}`;
    confidence = ticket ? "high" : "medium";
    action = ticket
      ? `Escalate ${ticket.evidence.split(":")[0]} to blocking priority and roll back or patch the regression -- this is a known, unresolved issue causing production failures.`
      : "Roll back the recent deploy to the affected service and investigate the latency regression.";
  } else if (logs) {
    story = `${job.job_name} failed: ${logs.summary}`;
    confidence = "medium";
    action = "Investigate the dependency service directly; no clear upstream cause found in deploys/metrics.";
  } else {
    story = `${job.job_name} run ${job.run_id} status: ${job.status}. No strong signal found.`;
    confidence = "low";
    action = "Manual investigation recommended -- specialists found no clear correlated evidence.";
  }

  const evidenceTrail = relevant.map((f) => f.evidence);

  let shortSummary;
  if (ticket) {
    shortSummary = `${job.job_name} failure traced to ${ticket.evidence.split(":")[0]} (known regression).`;
  } else if (deploy) {
    const target = deploy.evidence.split("->")[1].split(" at")[0].trim();
    shortSummary = `${job.job_name} failure traced to a recent deploy to ${target}.`;
  } else {
    shortSummary = story.length > 140 ? story.slice(0, 140) + "..." : story;
  }

  return {
    root_cause: story,
    short_summary: shortSummary,
    evidence_trail: evidenceTrail,
    suggested_action: action,
    confidence,
  };
}
