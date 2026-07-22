import assert from 'node:assert/strict';

import {
  aiSearchRetryDelaySeconds,
  buildAiSearchIndexHash,
  buildAiSearchItemKey,
  buildProjectAiSearchInstanceId,
  stableAiSearchToken,
} from '../src/services/ai-search-indexing-service.ts';

const firstInstance = buildProjectAiSearchInstanceId(
  'project:shadcn-ui-docs',
  'Shadcn UI Docs',
);
const repeatedInstance = buildProjectAiSearchInstanceId(
  'project:shadcn-ui-docs',
  'Shadcn UI Docs',
);
const otherInstance = buildProjectAiSearchInstanceId(
  'project:zustand-docs',
  'Shadcn UI Docs',
);

assert.equal(firstInstance, repeatedInstance, 'instance IDs must be deterministic');
assert.notEqual(firstInstance, otherInstance, 'stable project IDs must isolate instances');
assert.match(firstInstance, /^[a-z0-9_]+(?:-[a-z0-9_]+)*$/u);
assert.ok(firstInstance.length <= 64, 'Cloudflare instance IDs must not exceed 64 characters');
assert.equal(stableAiSearchToken('same'), stableAiSearchToken('same'));

const markdownKey = buildAiSearchItemKey(
  'file:components/button/with/a/path/that/is/far/longer/than/the/item-key-prefix',
  'sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  'markdown',
);
const changedKey = buildAiSearchItemKey(
  'file:components/button/with/a/path/that/is/far/longer/than/the/item-key-prefix',
  'sha256:fedcba98765432100123456789abcdef0123456789abcdef0123456789abcdef',
  'markdown',
);
assert.match(markdownKey, /^documents\/[a-z0-9_-]+\.md$/u);
assert.ok(markdownKey.length <= 128, 'item keys must remain below the platform limit');
assert.notEqual(markdownKey, changedKey, 'content revisions must receive versioned keys');
assert.match(
  buildAiSearchItemKey('json-file', 'sha256:abcdef', 'json'),
  /\.json$/u,
);
assert.match(
  buildAiSearchItemKey('text-file', 'sha256:abcdef', 'text'),
  /\.txt$/u,
);

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
