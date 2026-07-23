import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'record-run-state.mjs');
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'prompt-web-run-state-'));

function execute(action, runId, outcomes = {}) {
  const result = spawnSync(process.execPath, [scriptPath, action], {
    cwd: tempRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      GITHUB_RUN_ID: String(runId),
      GITHUB_RUN_ATTEMPT: '1',
      GITHUB_RUN_NUMBER: String(runId),
      GITHUB_REPOSITORY: 'ActiveInsighter/prompt-web',
      GITHUB_SERVER_URL: 'https://github.com',
      GITHUB_WORKFLOW: 'Prompt Web CI',
      GITHUB_REF_NAME: 'main',
      GITHUB_SHA: `sha-${runId}`,
      CI_OUTCOME: outcomes.ci || '',
      ARTIFACT_OUTCOME: outcomes.artifact || ''
    }
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
}

execute('start', 1001);
let latest = JSON.parse(await fs.readFile(path.join(tempRoot, '.github/latest-run.json'), 'utf8'));
assert.equal(latest.status, 'running');
assert.equal(latest.run_id, '1001');

execute('finish', 1001, { ci: 'success', artifact: 'success' });
latest = JSON.parse(await fs.readFile(path.join(tempRoot, '.github/latest-run.json'), 'utf8'));
assert.equal(latest.status, 'success');
assert.equal(latest.ci_outcome, 'success');
assert.ok(latest.finished_at);

for (let runId = 1002; runId <= 1013; runId += 1) {
  execute('start', runId);
  execute('finish', runId, { ci: 'success', artifact: 'success' });
}

const history = JSON.parse(await fs.readFile(path.join(tempRoot, '.github/build-history.json'), 'utf8'));
assert.equal(history.length, 10);
assert.equal(history[0].run_id, '1013');
assert.equal(history.at(-1).run_id, '1004');

const recentRunIds = (await fs.readFile(path.join(tempRoot, '.github/recent-run-ids.txt'), 'utf8'))
  .trim()
  .split(/\r?\n/);
assert.deepEqual(recentRunIds, [
  '1013',
  '1012',
  '1011',
  '1010',
  '1009',
  '1008',
  '1007',
  '1006',
  '1005',
  '1004'
]);

console.log('Run-state self test passed.');
