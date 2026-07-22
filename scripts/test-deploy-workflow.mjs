import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const workflow = await readFile(new URL('../.github/workflows/deploy-worker.yml', import.meta.url), 'utf8');

function extractRunScript(stepName) {
  const lines = workflow.split('\n');
  const stepIndex = lines.findIndex((line) => line === `      - name: ${stepName}`);
  assert.notEqual(stepIndex, -1, `missing workflow step: ${stepName}`);

  const runIndex = lines.findIndex(
    (line, index) => index > stepIndex && line === '        run: |',
  );
  assert.notEqual(runIndex, -1, `missing run block for workflow step: ${stepName}`);

  const body = [];
  for (let index = runIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.startsWith('      - name: ')) break;
    body.push(line.startsWith('          ') ? line.slice(10) : line);
  }
  return `${body.join('\n')}\n`;
}

function assertValidBash(stepName) {
  const result = spawnSync('bash', ['-n'], {
    input: extractRunScript(stepName),
    encoding: 'utf8',
  });
  assert.equal(
    result.status,
    0,
    `${stepName} shell syntax must be valid:\n${result.stderr || result.stdout}`,
  );
}

assert.equal(
  workflow.includes('/ai-index'),
  false,
  'deployment smoke tests must not depend on the removed crawler index',
);
assert.equal(
  workflow.includes("info.version !== '0.9.0'"),
  true,
  'deployment smoke tests must validate the current service version',
);
assert.equal(
  workflow.includes('/api/admin/ai-search/process?limit=10'),
  true,
  'deployment must prime a bounded AI Search batch after content synchronization',
);
assert.equal(
  workflow.includes('/api/admin/ai-search/status'),
  true,
  'deployment must validate the D1 indexing outbox status',
);
assert.equal(
  workflow.includes('/api/ai-search/info'),
  true,
  'deployment must validate the built-in Items discovery contract',
);
assert.equal(
  workflow.includes('/api/ai-search?q=documentation&limit=3&threshold=0'),
  true,
  'deployment must execute a real semantic search after priming the index',
);
assert.equal(
  workflow.includes('authenticated_json()'),
  true,
  'protected post-deploy requests must use a propagation-aware helper',
);
assert.equal(
  workflow.includes("--write-out '%{http_code}'"),
  true,
  'protected post-deploy requests must inspect HTTP status without aborting on a transient 401',
);
assert.equal(
  workflow.includes('Authenticated request attempt'),
  true,
  'protected post-deploy retries must leave actionable diagnostics',
);

assertValidBash('Prime AI Search index');
assertValidBash('Smoke test deployed Worker');

console.log('deployment workflow contract tests passed');
