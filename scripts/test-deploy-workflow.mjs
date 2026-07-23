import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const workflow = await readFile(new URL('../.github/workflows/deploy-worker.yml', import.meta.url), 'utf8');
const productionVerificationWorkflow = await readFile(
  new URL('../.github/workflows/verify-unified-production-api.yml', import.meta.url),
  'utf8',
);

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
  'deployment must process a bounded asynchronous upload and verification batch',
);
assert.equal(
  workflow.includes('/api/admin/ai-search/process?limit=3'),
  false,
  'deployment must use the current migration batch size',
);
assert.equal(
  workflow.includes('/api/admin/ai-search/status'),
  true,
  'deployment must validate indexing state',
);
for (const contract of [
  'status.documents?.expected',
  'status.documents?.indexed',
  'status.documents?.waiting',
  'status.documents?.error',
  'status.documents?.missing',
  'status.migrations?.pendingInstanceCleanup',
]) {
  assert.equal(
    workflow.includes(contract),
    true,
    `deployment convergence check must include ${contract}`,
  );
}
assert.equal(
  workflow.includes('indexed === expected'),
  true,
  'deployment must wait for every expected source document',
);
assert.equal(
  workflow.includes('activeJobs === 0'),
  true,
  'deployment must wait for the outbox to drain',
);
assert.equal(
  workflow.includes('pendingCleanup === 0'),
  true,
  'deployment must wait until legacy hashed instances are removed',
);

for (const readableContract of [
  'Verify readable AI Search remote layout',
  "expected_instances=\"$(jq -c '[.projects[].slug] | sort'",
  "actual_instances=\"$(jq -c '[.result[].id] | sort'",
  "(.path | sub(\"^/\"; \"\"))",
  'items?per_page=50&page=$page',
  'select(.status != "completed")',
  'startswith("documents/file-")',
  'AI Search item total does not match the source manifest',
]) {
  assert.equal(
    workflow.includes(readableContract),
    true,
    `deployment must enforce readable remote layout contract: ${readableContract}`,
  );
}
assert.equal(
  workflow.includes('/api/ai-search/info'),
  true,
  'deployment must validate the built-in Items discovery contract',
);
assert.equal(
  workflow.includes('/api/ai-search?q=documentation&limit=3&threshold=0'),
  true,
  'deployment must execute a real semantic search after migration',
);
assert.equal(
  workflow.includes('authenticated_json()'),
  true,
  'protected post-deploy requests must use a propagation-aware helper',
);
assert.equal(
  workflow.includes("--write-out '%{http_code}'"),
  true,
  'protected post-deploy retries must inspect HTTP status without aborting on a transient 401',
);
assert.equal(
  workflow.includes('Authenticated request attempt'),
  true,
  'protected post-deploy retries must leave actionable diagnostics',
);

assert.equal(
  productionVerificationWorkflow.includes('/ai-index'),
  false,
  'production verification must not probe the removed crawler index routes',
);
assert.equal(
  productionVerificationWorkflow.includes('User-agent: Cloudflare-AI-Search'),
  false,
  'production verification must not depend on crawler-specific robots rules',
);
assert.equal(
  productionVerificationWorkflow.includes('/sitemap.xml'),
  false,
  'production verification must not depend on the removed crawler sitemap',
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
  'production verification must execute a real project-isolated semantic search',
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

assertValidBash('Prime AI Search index');
assertValidBash('Verify readable AI Search remote layout');
assertValidBash('Smoke test deployed Worker');

console.log('deployment and production verification workflow contract tests passed');
