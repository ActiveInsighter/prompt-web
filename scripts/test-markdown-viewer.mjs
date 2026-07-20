import assert from 'node:assert/strict';
import {
  buildPromptUri,
  buildRawPath,
  buildViewerPath,
  identifierFromViewerUrl,
  normalizeViewerInput,
} from '../public/viewer-core.js';

const origin = 'https://prompt.example.com';
const identifier = 'prompt://prompt-library/guides/content-sync.md';

assert.equal(
  buildPromptUri('prompt-library', '/guides/content-sync.md'),
  identifier,
);
assert.equal(
  buildViewerPath(identifier),
  '/p/prompt-library/guides/content-sync.md',
);
assert.equal(
  buildRawPath(identifier),
  '/raw/prompt-library/guides/content-sync.md',
);
assert.equal(
  identifierFromViewerUrl(`${origin}/p/prompt-library/guides/content-sync.md`, origin),
  identifier,
);
assert.equal(
  identifierFromViewerUrl(`${origin}/p?identifier=${encodeURIComponent(identifier)}`, origin),
  identifier,
);

for (const value of [
  identifier,
  'prompt-library:/guides/content-sync.md',
  'prompt-library/guides/content-sync.md',
  '/p/prompt-library/guides/content-sync.md',
  '/raw/prompt-library/guides/content-sync.md',
  `${origin}/p/prompt-library/guides/content-sync.md`,
  `${origin}/raw/prompt-library/guides/content-sync.md`,
  `${origin}/api/files/fetch?identifier=${encodeURIComponent(identifier)}`,
]) {
  assert.equal(
    normalizeViewerInput(value, origin),
    '/p/prompt-library/guides/content-sync.md',
    `Unexpected viewer route for ${value}`,
  );
}

assert.equal(
  normalizeViewerInput('prompt-library-content-sync-guide', origin),
  '/p?identifier=prompt-library-content-sync-guide',
);
assert.throws(() => normalizeViewerInput('   ', origin), /enter a Markdown identifier/i);

console.log('Markdown viewer URL tests passed.');
