/**
 * JS port of backend/app/orchestrator.py -- runs the full investigate flow
 * client-side (no backend needed). Emits the exact same event shapes the
 * real backend's SSE stream does, so reducer.js and every component are
 * unchanged whether events come from fetch/SSE or this local simulator.
 *
 * This is what powers the standalone Vercel deploy: `npm run dev`/`build`
 * needs nothing else running. Point VITE_API_BASE at a real backend (see
 * ../api.js) to drive the UI from the actual Python orchestrator instead.
 */
import * as tools from "./tools";
import * as mockLlm from "./mockLlm";
import { memoryStore } from "./memoryStore";

// Which dependency service each job's specialists should investigate.
// Real system: this would come from a service-ownership/dependency graph.
const JOB_TO_SERVICE = {
  settlement_batch_job: "pricing-service",
  fx_reval_job: "pricing-service",
  nightly_auth_sync_job: "auth-gateway",
};
const DEFAULT_SERVICE = "pricing-service";
const TICKET_ID_RE = /^[A-Z]{2,}-\d+/;

function extractTicketId(finding) {
  if (!finding) return null;
  const match = finding.evidence.match(TICKET_ID_RE);
  return match ? match[0] : null;
}

export async function investigateLocal(question, jobName, onEvent) {
  const job = tools.getJobRun(jobName);
  if (!job) {
    onEvent({ type: "error", message: `no run found for job ${jobName}` });
    return;
  }

  const service = JOB_TO_SERVICE[jobName] || DEFAULT_SERVICE;

  onEvent({ type: "memory_check" });
  await mockLlm.thinkingDelay(400, 900);
  const memoryHit = memoryStore.findMatch(service, job.error || "");
  if (memoryHit) {
    onEvent({ type: "memory_hit", incident_id: memoryHit.incidentId, summary: memoryHit.summary });
    const result = {
      question,
      job_name: jobName,
      memory_hit: {
        incident_id: memoryHit.incidentId,
        summary: memoryHit.summary,
        root_cause: memoryHit.rootCause,
        ticket_id: memoryHit.ticketId,
      },
      findings: [],
      root_cause: memoryHit.rootCause,
      evidence_trail: [`Matched prior incident ${memoryHit.incidentId}: ${memoryHit.summary}`],
      suggested_action: `Escalate ${memoryHit.ticketId || "the linked ticket"} — this is a recurrence.`,
      confidence: "high",
    };
    onEvent({ type: "done", result });
    return;
  }

  onEvent({ type: "memory_miss" });

  const [depSince, depUntil] = tools.windowAround(job.start_time, 90, 5);
  const [metSince, metUntil] = tools.windowAround(job.start_time, 45, 10);

  const specialistJobs = {
    deploys: () => mockLlm.mockDeployFinding(job, tools.getDeploys(depSince, depUntil)),
    metrics: () => mockLlm.mockMetricsFinding(job, tools.getMetrics(service, metSince, metUntil)),
    logs: () => mockLlm.mockLogsFinding(job, tools.getLogs(job.run_id)),
    tickets: () => mockLlm.mockTicketsFinding(service, tools.getTickets(service)),
  };

  const domains = Object.keys(specialistJobs);
  domains.forEach((d) => onEvent({ type: "specialist_start", domain: d }));

  const settled = await Promise.all(
    domains.map(async (domain) => {
      try {
        const finding = await specialistJobs[domain]();
        onEvent({ type: "specialist_result", domain, finding });
        return { domain, finding };
      } catch (err) {
        onEvent({ type: "specialist_error", domain, message: String(err) });
        return null;
      }
    })
  );

  const findings = settled.filter(Boolean).map((s) => ({ domain: s.domain, ...s.finding }));

  if (!findings.length) {
    onEvent({ type: "error", message: "all specialists failed; no findings to synthesize" });
    return;
  }

  onEvent({ type: "synthesizing" });
  const synthesis = await mockLlm.mockSynthesis(question, job, findings);

  const result = {
    question,
    job_name: jobName,
    memory_hit: null,
    findings,
    root_cause: synthesis.root_cause,
    evidence_trail: synthesis.evidence_trail,
    suggested_action: synthesis.suggested_action,
    confidence: synthesis.confidence,
  };

  const relevantTicket = findings.find((f) => f.domain === "tickets" && f.relevant);
  memoryStore.add({
    incidentId: job.run_id,
    jobName,
    service,
    errorText: job.error || "",
    summary: synthesis.short_summary || synthesis.root_cause,
    rootCause: synthesis.root_cause,
    ticketId: extractTicketId(relevantTicket),
  });

  onEvent({ type: "done", result });
}
