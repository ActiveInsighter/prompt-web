import assert from 'node:assert/strict';

import {
  aiSearchRetryDelaySeconds,
  buildAiSearchIndexHash,
  buildAiSearchItemKey,
  buildProjectAiSearchInstanceId,
  stableAiSearchToken,
} from '../src/services/ai-search-indexing-service.ts';

assert.equal(
  buildProjectAiSearchInstanceId('shadcn-ui-docs'),
  'shadcn-ui-docs',
  'instance names must be the readable project slug without a generated ID suffix',
);
assert.equal(
  buildProjectAiSearchInstanceId('Shadcn UI Docs'),
  'shadcn-ui-docs',
  'display names must normalize into readable Cloudflare instance names',
);
assert.equal(buildProjectAiSearchInstanceId('prompt_library'), 'prompt_library');
assert.match(buildProjectAiSearchInstanceId('Tailwind CSS Docs'), /^[a-z0-9_]+(?:-[a-z0-9_]+)*$/u);
assert.ok(
  buildProjectAiSearchInstanceId('a'.repeat(100)).length <= 64,
  'Cloudflare instance IDs must not exceed 64 characters',
);
assert.equal(stableAiSearchToken('same'), stableAiSearchToken('same'));

assert.equal(
  buildAiSearchItemKey('/components/progress.md'),
  'components/progress.md',
  'AI Search item keys must match the project-relative source path',
);
assert.equal(
  buildAiSearchItemKey('guides\\content-sync.md'),
  'guides/content-sync.md',
  'Windows separators must normalize without replacing the readable source name',
);
assert.equal(
  buildAiSearchItemKey('/中文目录/使用说明.md'),
  '中文目录/使用说明.md',
  'Unicode source names must remain readable',
);
assert.equal(buildAiSearchItemKey('/components/./button.md'), 'components/button.md');
assert.throws(() => buildAiSearchItemKey('../secret.md'), /Invalid source path/u);
assert.throws(() => buildAiSearchItemKey('/'), /Invalid source path/u);

assert.equal(
  buildAiSearchIndexHash('sha256:file', 'sha256:project'),
  'sha256:file|sha256:project',
  'project configuration changes must invalidate every file revision',
);
assert.deepEqual(
  [1, 2, 3, 4, 10].map(aiSearchRetryDelaySeconds),
  [30, 60, 120, 240, 3600],
  'retry delays must back off and cap at one hour',
);

console.log('AI Search storage tests passed');
