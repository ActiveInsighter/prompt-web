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
assert.ok(serialized.includes('\\u003cProgress value={33} /\\u003e'));
assert.ok(serialized.includes('\\u003cTabsTrigger'));
assert.ok(serialized.includes('\\u003eCommand\\u003c/TabsTrigger\\u003e'));
assert.deepEqual(JSON.parse(serialized), source, 'AI-safe JSON must preserve the exact source after parsing.');

const aiSearchPayload = {
  schemaVersion: '1.0',
  engine: 'cloudflare-ai-search',
  searchQuery: 'padding',
  query: {
    text: 'padding',
    project: { slug: 'tailwindcss-docs', name: 'Tailwind CSS Docs' },
    mode: 'vector',
    limit: 5,
  },
  count: 2,
  results: [
    {
      id: 'padding-1',
      type: 'text',
      score: 0.91,
      text: '# padding\n\n`p-\\u003cnumber\\u003e`\n\n\\u003cdiv class="p-8"\\u003ep-8\\u003c/div\\u003e',
      source: {
        key: 'https://prompt.example.com/ai-index/tailwindcss-docs/spacing/padding.md',
        url: 'https://prompt.example.com/ai-index/tailwindcss-docs/spacing/padding.md',
        project: 'tailwindcss-docs',
        path: '/spacing/padding.md',
        rawPath: '/raw/tailwindcss-docs/spacing/padding.md',
        metadata: { chunk_modality: 'text' },
      },
      scoringDetails: { vector_score: 0.91 },
    },
    {
      id: 'escaping-1',
      type: 'text',
      score: 0.72,
      text: 'Literal documentation of \\u003c must stay literal outside /ai-index.',
      source: {
        key: 'https://prompt.example.com/raw/tailwindcss-docs/escaping.md',
        url: 'https://prompt.example.com/raw/tailwindcss-docs/escaping.md',
        project: 'tailwindcss-docs',
        path: '/escaping.md',
        rawPath: '/raw/tailwindcss-docs/escaping.md',
      },
    },
  ],
  diagnostics: { retrievedChunks: 50 },
};

const serializedAiSearch = serializeAiSafeJson(aiSearchPayload);
const parsedAiSearch = JSON.parse(serializedAiSearch);

assert.equal(
  serializedAiSearch.includes('\\\\u003cdiv'),
  false,
  'AI Search JSON must not contain a second backslash layer for indexed tags.',
);
assert.ok(
  serializedAiSearch.includes('\\u003cdiv'),
  'AI Search JSON should retain one safe transport-level Unicode escape.',
);
assert.deepEqual(parsedAiSearch, {
  query: 'padding',
  project: 'tailwindcss-docs',
  count: 2,
  results: [
    {
      score: 0.91,
      text: '# padding\n\n`p-<number>`\n\n<div class="p-8">p-8</div>',
      project: 'tailwindcss-docs',
      path: '/spacing/padding.md',
      url: 'https://prompt.example.com/raw/tailwindcss-docs/spacing/padding.md',
    },
    {
      score: 0.72,
      text: 'Literal documentation of \\u003c must stay literal outside /ai-index.',
      project: 'tailwindcss-docs',
      path: '/escaping.md',
      url: 'https://prompt.example.com/raw/tailwindcss-docs/escaping.md',
    },
  ],
});
assert.equal(serializedAiSearch.includes('diagnostics'), false);
assert.equal(serializedAiSearch.includes('scoringDetails'), false);
assert.equal(serializedAiSearch.includes('schemaVersion'), false);
assert.equal(serializedAiSearch.includes('cloudflare-ai-search'), false);

assert.throws(() => serializeAiSafeJson(undefined), /not JSON serializable/i);

console.log('AI-safe JSON serialization tests passed.');
