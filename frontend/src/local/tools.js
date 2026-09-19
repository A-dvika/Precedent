/**
 * JS port of backend/app/tools.py -- read-only connectors over the same
 * simulated dataset, kept in lockstep with the Python version so the
 * client-side demo (used for the shareable/Vercel link, no backend needed)
 * and the real backend behave identically.
 */
import jobs from "./data/jobs.json";
import deploys from "./data/deploys.json";
import metricsData from "./data/metrics.json";
import logs from "./data/logs.json";
import tickets from "./data/tickets.json";

export function getJobRun(jobName) {
  const matches = jobs.filter((j) => j.job_name === jobName);
  if (matches.length === 0) return null;
  return [...matches].sort((a, b) => a.start_time.localeCompare(b.start_time)).at(-1);
}

export function getDeploys(since, until) {
  const start = new Date(since).getTime();
  const end = new Date(until).getTime();
  return deploys.filter((d) => {
    const ts = new Date(d.deployed_at).getTime();
    return ts >= start && ts <= end;
  });
}

export function getMetrics(service, since, until) {
  const data = metricsData[service];
  if (!data) return null;
  const start = new Date(since).getTime();
  const end = new Date(until).getTime();
  const series = data.series.filter((p) => {
    const ts = new Date(p.ts).getTime();
    return ts >= start && ts <= end;
  });
  return { service, baseline_ms: data.baseline_ms, series };
}

export function getLogs(runId) {
  return logs[runId] || [];
}

export function getTickets(linkedService) {
  return tickets.filter((t) => !linkedService || t.linked_service === linkedService);
}

export function windowAround(isoTs, minutesBefore = 60, minutesAfter = 5) {
  const ts = new Date(isoTs).getTime();
  const since = new Date(ts - minutesBefore * 60000).toISOString();
  const until = new Date(ts + minutesAfter * 60000).toISOString();
  return [since, until];
}
