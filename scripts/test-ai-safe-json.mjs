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
  results: [
    {
      text: '# padding\n\n`p-\\u003cnumber\\u003e`\n\n\\u003cdiv class="p-8"\\u003ep-8\\u003c/div\\u003e',
      source: {
        key: 'https://prompt.example.com/ai-index/tailwindcss-docs/padding.md',
      },
    },
    {
      text: 'Literal documentation of \\u003c must stay literal outside /ai-index.',
      source: {
        key: 'https://prompt.example.com/raw/tailwindcss-docs/escaping.md',
      },
    },
  ],
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
assert.equal(
  parsedAiSearch.results[0].text,
  '# padding\n\n`p-<number>`\n\n<div class="p-8">p-8</div>',
  'JSON consumers should receive the original Markdown and HTML tags.',
);
assert.equal(
  parsedAiSearch.results[1].text,
  'Literal documentation of \\u003c must stay literal outside /ai-index.',
  'Only /ai-index search results should be restored.',
);
assert.equal(parsedAiSearch.results[0].text.startsWith('# padding'), true);
assert.equal(parsedAiSearch.results[0].text.includes('`p-<number>`'), true);

assert.throws(() => serializeAiSafeJson(undefined), /not JSON serializable/i);

console.log('AI-safe JSON serialization tests passed.');
