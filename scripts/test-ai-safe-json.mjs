import assert from 'node:assert/strict';

import { serializeAiSafeJson } from '../src/http/ai-safe-json.ts';

const source = {
  path: 'components/progress.md',
  content: [
    '<Progress value={33} />',
    '<TabsTrigger value="cli">Command</TabsTrigger>',
    '<Slider onValueChange={(value) => setValue(value)} />',
    'safe & searchable',
    '\u2028line separator\u2029',
  ].join('\n'),
};

const serialized = serializeAiSafeJson(source);
assert.equal(serialized.includes('<'), false, 'Serialized JSON must not contain literal < characters.');
assert.equal(serialized.includes('>'), false, 'Serialized JSON must not contain literal > characters.');
assert.equal(serialized.includes('&'), false, 'Serialized JSON must not contain literal & characters.');
assert.deepEqual(JSON.parse(serialized), source, 'AI-safe JSON must preserve exact source text.');

const directMarkdown = [
  '# padding',
  '',
  '| `p-<number>` | `padding: calc(var(--spacing) * <number>);` |',
  '',
  '```html',
  '<div class="p-8">p-8</div>',
  '```',
].join('\n');
const aiSearchPayload = {
  engine: 'cloudflare-ai-search',
  searchQuery: 'padding',
  query: {
    text: 'padding',
    project: { slug: 'tailwindcss-docs', name: 'Tailwind CSS Docs' },
  },
  results: [
    {
      id: 'padding-1',
      type: 'text',
      score: 0.91,
      text: directMarkdown,
      source: {
        key: 'documents/padding-abcd.md',
        url: 'https://prompt.example.com/raw/tailwindcss-docs/spacing/padding.md',
        project: 'tailwindcss-docs',
        path: '/spacing/padding.md',
        rawPath: '/raw/tailwindcss-docs/spacing/padding.md',
        title: 'Padding',
        metadata: { file_id: 'padding-file' },
      },
      scoringDetails: { vector_score: 0.91 },
    },
  ],
  diagnostics: { retrievedChunks: 10 },
  meta: { mode: 'vector', group: 'files', duration_ms: 86 },
};

const serializedAiSearch = serializeAiSafeJson(aiSearchPayload);
const parsedAiSearch = JSON.parse(serializedAiSearch);
assert.deepEqual(parsedAiSearch, {
  query: 'padding',
  project: 'tailwindcss-docs',
  count: 1,
  results: [
    {
      score: 0.91,
      title: 'Padding',
      text: directMarkdown,
      project: 'tailwindcss-docs',
      path: '/spacing/padding.md',
      uri: 'prompt://tailwindcss-docs/spacing/padding.md',
      url: 'https://prompt.example.com/raw/tailwindcss-docs/spacing/padding.md',
    },
  ],
  meta: { mode: 'vector', group: 'files', duration_ms: 86 },
});
assert.equal(serializedAiSearch.includes('diagnostics'), false);
assert.equal(serializedAiSearch.includes('scoringDetails'), false);
assert.equal(parsedAiSearch.results[0].text, directMarkdown);

for (const mode of ['auto', 'hybrid', 'keyword']) {
  const parsed = JSON.parse(
    serializeAiSafeJson({
      ...aiSearchPayload,
      meta: { ...aiSearchPayload.meta, mode },
    }),
  );
  assert.equal(parsed.meta.mode, mode, `Requested ${mode} mode must be preserved.`);
}

assert.throws(() => serializeAiSafeJson(undefined), /not JSON serializable/i);
console.log('AI-safe JSON serialization tests passed');
