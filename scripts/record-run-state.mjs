import fs from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const action = process.argv[2] || 'start';
const stateDir = path.resolve(projectRoot, '.github');
const latestPath = path.join(stateDir, 'latest-run.json');
const historyPath = path.join(stateDir, 'build-history.json');
const latestIdPath = path.join(stateDir, 'latest-run-id.txt');
const latestUrlPath = path.join(stateDir, 'latest-run-url.txt');
const recentIdsPath = path.join(stateDir, 'recent-run-ids.txt');
const buildLogPath = '.github/latest-build-log.txt';
const actionsLogPath = '.github/latest-actions-log.txt';

function now() {
  return new Date().toISOString();
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function runUrl(runId) {
  const repository = process.env.GITHUB_REPOSITORY || '';
  const server = process.env.GITHUB_SERVER_URL || 'https://github.com';
  return repository && runId ? `${server}/${repository}/actions/runs/${runId}` : '';
}

function baseRecord(status) {
  const runId = process.env.GITHUB_RUN_ID || 'local';
  return {
    run_id: String(runId),
    run_attempt: process.env.GITHUB_RUN_ATTEMPT || '',
    run_number: process.env.GITHUB_RUN_NUMBER || '',
    run_url: runUrl(runId),
    workflow: process.env.GITHUB_WORKFLOW || '',
    workflow_ref: process.env.GITHUB_WORKFLOW_REF || '',
    event_name: process.env.GITHUB_EVENT_NAME || '',
    job: process.env.GITHUB_JOB || '',
    actor: process.env.GITHUB_ACTOR || '',
    repository: process.env.GITHUB_REPOSITORY || '',
    branch: process.env.GITHUB_REF_NAME || '',
    head_sha: process.env.GITHUB_SHA || '',
    status,
    started_at: now(),
    finished_at: null,
    duration_seconds: null,
    ci_outcome: null,
    artifact_outcome: null,
    build_log_file: buildLogPath,
    actions_log_file: actionsLogPath
  };
}

function secondsBetween(start, end) {
  const startMs = Date.parse(start || '');
  const endMs = Date.parse(end || '');
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return null;
  return Math.max(0, Math.round((endMs - startMs) / 1000));
}

function upsert(history, record) {
  const records = Array.isArray(history) ? history.filter(Boolean) : [];
  const index = records.findIndex((item) => String(item.run_id) === String(record.run_id));

  if (index >= 0) {
    records[index] = { ...records[index], ...record };
  } else {
    records.unshift(record);
  }

  records.sort((a, b) => String(b.started_at || '').localeCompare(String(a.started_at || '')));
  return records.slice(0, 10);
}

if (!['start', 'finish'].includes(action)) {
  throw new Error(`Unknown action: ${action}. Expected "start" or "finish".`);
}

await fs.mkdir(stateDir, { recursive: true });

let latest = await readJson(latestPath, null);
let history = await readJson(historyPath, []);
let record;

if (action === 'start') {
  record = baseRecord('running');
} else {
  const ciOutcome = process.env.CI_OUTCOME || '';
  const artifactOutcome = process.env.ARTIFACT_OUTCOME || '';
  const status = ciOutcome === 'success' && artifactOutcome === 'success' ? 'success' : 'failure';
  record = latest && String(latest.run_id) === String(process.env.GITHUB_RUN_ID)
    ? { ...latest }
    : baseRecord(status);
  const finishedAt = now();

  record.status = status;
  record.finished_at = finishedAt;
  record.duration_seconds = secondsBetween(record.started_at, finishedAt);
  record.ci_outcome = ciOutcome;
  record.artifact_outcome = artifactOutcome;
}

latest = record;
history = upsert(history, record);
const recentRunIds = history
  .map((item) => String(item.run_id ?? ''))
  .filter(Boolean)
  .slice(0, 10);

await fs.writeFile(latestPath, `${JSON.stringify(latest, null, 2)}\n`, 'utf8');
await fs.writeFile(historyPath, `${JSON.stringify(history, null, 2)}\n`, 'utf8');
await fs.writeFile(latestIdPath, `${latest.run_id}\n`, 'utf8');
await fs.writeFile(latestUrlPath, `${latest.run_url}\n`, 'utf8');
await fs.writeFile(recentIdsPath, `${recentRunIds.join('\n')}\n`, 'utf8');

console.log(`Recorded run ${latest.run_id}: ${latest.status}; retained ${recentRunIds.length} run id(s).`);
