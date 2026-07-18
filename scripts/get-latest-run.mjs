import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const projectRoot = process.cwd();
const args = process.argv.slice(2);

function valueAfter(flag, fallback = '') {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

function parseRemoteRepository() {
  const result = spawnSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' });
  if (result.status !== 0) return '';
  const remote = result.stdout.trim().replace(/\.git$/, '');
  const match = remote.match(/github\.com[/:]([^/]+)\/([^/]+)$/i);
  return match ? `${match[1]}/${match[2]}` : '';
}

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

async function githubRequest(url, token, accept = 'application/vnd.github+json') {
  const response = await fetch(url, {
    headers: {
      Accept: accept,
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'prompt-web-run-log-helper'
    },
    redirect: 'follow'
  });

  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
  }

  return response;
}

const stateDir = path.resolve(projectRoot, '.github');
const latestPath = path.join(stateDir, 'latest-run.json');
const repository = valueAfter('--repo', process.env.GITHUB_REPOSITORY || parseRemoteRepository());
const workflow = valueAfter('--workflow', 'ci.yml');
const branch = valueAfter('--branch', 'main');
const explicitRunId = valueAfter('--run-id', process.env.TARGET_RUN_ID || '');
const withLogs = args.includes('--logs');
const writeState = args.includes('--write') || Boolean(process.env.GITHUB_ACTIONS);
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';

if (!repository) {
  throw new Error('Cannot determine repository. Pass --repo owner/name or configure git origin.');
}

let run;
if (token) {
  if (explicitRunId) {
    const response = await githubRequest(`https://api.github.com/repos/${repository}/actions/runs/${explicitRunId}`, token);
    run = await response.json();
  } else {
    const workflowId = encodeURIComponent(workflow);
    const url = new URL(`https://api.github.com/repos/${repository}/actions/workflows/${workflowId}/runs`);
    url.searchParams.set('branch', branch);
    url.searchParams.set('per_page', '1');
    const response = await githubRequest(url, token);
    const payload = await response.json();
    run = payload.workflow_runs?.[0];
  }
} else {
  run = await readJson(latestPath);
}

if (!run) {
  throw new Error(token
    ? `No workflow run found for ${repository}, workflow ${workflow}, branch ${branch}.`
    : 'No local run state found and GH_TOKEN/GITHUB_TOKEN is not set.');
}

const normalized = {
  run_id: String(run.id ?? run.run_id),
  run_number: String(run.run_number ?? ''),
  run_attempt: String(run.run_attempt ?? ''),
  run_url: run.html_url ?? run.run_url ?? '',
  workflow: run.name ?? run.workflow ?? '',
  event_name: run.event ?? run.event_name ?? '',
  branch: run.head_branch ?? run.branch ?? branch,
  head_sha: run.head_sha ?? '',
  status: run.status === 'completed' ? (run.conclusion || 'completed') : (run.status || 'unknown'),
  conclusion: run.conclusion ?? null,
  created_at: run.created_at ?? run.started_at ?? null,
  updated_at: run.updated_at ?? run.finished_at ?? null,
  build_log_file: '.github/latest-build-log.txt',
  actions_log_file: '.github/latest-actions-log.txt'
};

console.log(JSON.stringify(normalized, null, 2));

if (writeState) {
  await fs.mkdir(stateDir, { recursive: true });
  await fs.writeFile(path.join(stateDir, 'latest-run-id.txt'), `${normalized.run_id}\n`, 'utf8');
  await fs.writeFile(path.join(stateDir, 'latest-run-url.txt'), `${normalized.run_url}\n`, 'utf8');

  const existing = await readJson(latestPath, {});
  await fs.writeFile(latestPath, `${JSON.stringify({ ...existing, ...normalized }, null, 2)}\n`, 'utf8');
}

if (withLogs) {
  if (!token) {
    throw new Error('GH_TOKEN or GITHUB_TOKEN is required to download Actions job logs.');
  }

  const jobsResponse = await githubRequest(
    `https://api.github.com/repos/${repository}/actions/runs/${normalized.run_id}/jobs?filter=latest&per_page=100`,
    token
  );
  const jobs = (await jobsResponse.json()).jobs || [];
  const sections = [];

  for (const job of jobs) {
    const logResponse = await githubRequest(
      `https://api.github.com/repos/${repository}/actions/jobs/${job.id}/logs`,
      token,
      'application/vnd.github+json'
    );
    sections.push(`===== JOB: ${job.name} (${job.conclusion || job.status}) =====\n${await logResponse.text()}`);
  }

  const actionsLogPath = path.join(stateDir, 'latest-actions-log.txt');
  await fs.mkdir(stateDir, { recursive: true });
  await fs.writeFile(actionsLogPath, `${sections.join('\n\n')}\n`, 'utf8');
  console.log(`Saved ${jobs.length} job log(s) to ${path.relative(projectRoot, actionsLogPath)}.`);
}
