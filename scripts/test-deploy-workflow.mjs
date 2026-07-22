import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/deploy-worker.yml', import.meta.url), 'utf8');

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

console.log('deployment workflow contract tests passed');
