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
assert.throws(() => serializeAiSafeJson(undefined), /not JSON serializable/i);

console.log('AI-safe JSON serialization tests passed.');
