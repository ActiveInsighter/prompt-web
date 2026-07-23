import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const workflow = await readFile(new URL('../.github/workflows/deploy-worker.yml', import.meta.url), 'utf8');
const auditWorkflow = await readFile(
  new URL('../.github/workflows/audit-ai-search-migration.yml', import.meta.url),
  'utf8',
);
const productionVerificationWorkflow = await readFile(
  new URL('../.github/workflows/verify-unified-production-api.yml', import.meta.url),
  'utf8',
);

function extractRunScript(source, stepName) {
  const lines = source.split('\n');
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

function assertValidBash(source, stepName) {
  const result = spawnSync('bash', ['-n'], {
    input: extractRunScript(source, stepName),
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
  'deployment must start bounded asynchronous AI Search batches',
);
assert.equal(
  workflow.includes('for attempt in $(seq 1 6)'),
  true,
  'deployment must use a small bounded migration kickoff',
);
assert.equal(
  workflow.includes('for attempt in $(seq 1 120)'),
  false,
  'deployment must never wait for full asynchronous index convergence',
);
assert.equal(
  workflow.includes('AI Search migration is still in progress. This is expected and does not block deployment.'),
  true,
  'deployment must explicitly treat incomplete migration as nonblocking',
);
assert.equal(
  workflow.includes('indexed === expected'),
  false,
  'deployment must not require every source document to finish indexing',
);
assert.equal(
  workflow.includes('activeJobs === 0'),
  false,
  'deployment must not wait for the asynchronous outbox to drain',
);
assert.equal(
  workflow.includes('pendingCleanup === 0'),
  false,
  'deployment must not wait for legacy instance cleanup',
);
assert.equal(
  workflow.includes('legacy_instances_retained='),
  true,
  'deployment must report legacy instances retained during safe migration',
);
assert.equal(
  workflow.includes('Generated AI Search item names were found in readable instance'),
  true,
  'deployment must still reject unreadable keys inside new readable instances',
);
assert.equal(
  workflow.includes('/api/ai-search?q=documentation&limit=3&threshold=0'),
  true,
  'deployment must execute a real semantic-search canary',
);
assert.equal(
  workflow.includes('health.aiSearch?.documents?.expected'),
  true,
  'deployment must verify that AI Search initialization is visible in health',
);
assert.equal(
  workflow.includes('health.aiSearch?.documents?.indexed ?? 0) !=='),
  false,
  'smoke tests must not require full index completion',
);
assert.equal(
  workflow.includes('Full AI Search convergence is intentionally handled by the Worker cron'),
  true,
  'deployment summary must describe asynchronous convergence ownership',
);

for (const contract of [
  'workflow_dispatch:',
  'strict:',
  'Strict AI Search migration audit failed',
  'Legacy instances retained',
  'Generated Item names inside readable instances',
]) {
  assert.equal(
    auditWorkflow.includes(contract),
    true,
    `manual migration audit must include ${contract}`,
  );
}

assert.equal(
  productionVerificationWorkflow.includes('/ai-index'),
  false,
  'production verification must not probe removed crawler routes',
);
assert.equal(
  productionVerificationWorkflow.includes('/api/ai-search/info'),
  true,
  'production verification must validate built-in AI Search discovery',
);
assert.equal(
  productionVerificationWorkflow.includes(
    '/api/ai-search/shadcn-ui-docs?q=progress&limit=5&threshold=0',
  ),
  true,
  'production verification must execute a project-isolated semantic search',
);
assert.equal(
  productionVerificationWorkflow.includes("aiSearchInfo.storage !== 'built-in-items'"),
  true,
  'production verification must assert built-in Items storage',
);
assert.equal(
  productionVerificationWorkflow.includes(
    "aiSearchInfo.isolation !== 'one-instance-per-project'",
  ),
  true,
  'production verification must assert per-project AI Search isolation',
);

assertValidBash(workflow, 'Kick off AI Search migration');
assertValidBash(workflow, 'Report AI Search migration progress');
assertValidBash(workflow, 'Smoke test deployed Worker');
assertValidBash(auditWorkflow, 'Audit remote instances and Items');

console.log('nonblocking deployment and AI Search audit workflow contract tests passed');
