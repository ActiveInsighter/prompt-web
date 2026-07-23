import assert from 'node:assert/strict';

import {
  aiSearchRetryDelaySeconds,
  buildAiSearchIndexHash,
  buildAiSearchItemKey,
  buildAiSearchUploadContent,
  buildProjectAiSearchInstanceId,
  stableAiSearchToken,
} from '../src/services/ai-search-layout.ts';

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
assert.throws(
  () => buildProjectAiSearchInstanceId('a'.repeat(65)),
  /too long for a readable AI Search instance name/u,
  'long project slugs must fail instead of being silently truncated or given a hash suffix',
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

const frontmatterOnly = `---
pageType: home
hero:
  text: Bear necessities for React state
  tagline: A tiny, predictable store
features:
  - title: Minimal API
    details: Create a store with a single hook.
---`;
const projected = buildAiSearchUploadContent('/index.md', frontmatterOnly, 'markdown');
assert.match(projected, /^# index$/mu);
assert.match(projected, /^Source: index\.md$/mu);
assert.match(projected, /Bear necessities for React state/u);
assert.match(projected, /Create a store with a single hook/u);
assert.equal(
  projected.includes('---'),
  false,
  'frontmatter-only Markdown must become real searchable Markdown instead of an empty conversion',
);

const normalMarkdown = `---\ntitle: Progress\n---\n\n# Progress\n\nVisible body.`;
assert.equal(
  buildAiSearchUploadContent('/components/progress.md', normalMarkdown, 'markdown'),
  normalMarkdown,
  'normal Markdown with a body must be uploaded unchanged',
);
assert.equal(
  buildAiSearchUploadContent('/data.json', '{"ok":true}', 'json'),
  '{"ok":true}',
  'non-Markdown files must remain unchanged',
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
