import assert from 'node:assert/strict';

import {
  AiSearchRequestError,
  buildProjectFolderFilter,
  chunkMatchesProject,
  formatAiSearchResults,
  normalizeAiSearchFolderRoot,
  parseAiSearchProjectScopeMode,
  parseAiSearchRequest,
  parseIndexedSourceKey,
  resolveAiSearchFolderRoot,
} from '../src/http/cloudflare-ai-search-utils.ts';

assert.deepEqual(
  parseAiSearchRequest(
    'https://prompt.example.com/api/ai-search/shadcn-ui-docs?q=button&limit=5',
    'shadcn-ui-docs',
  ),
  {
    query: 'button',
    project: 'shadcn-ui-docs',
    requestedRetrievalType: 'vector',
    grouping: 'files',
    limit: 5,
    retrievalLimit: 15,
    matchThreshold: 0.4,
    contextExpansion: 0,
    reranking: false,
  },
);

assert.deepEqual(
  parseAiSearchRequest('https://prompt.example.com/api/ai-search?q=button'),
  {
    query: 'button',
    project: undefined,
    requestedRetrievalType: 'vector',
    grouping: 'files',
    limit: 10,
    retrievalLimit: 30,
    matchThreshold: 0.4,
    contextExpansion: 0,
    reranking: false,
  },
);

assert.equal(
  parseAiSearchRequest('https://prompt.example.com/api/ai-search?q=x&mode=hybrid&group=chunks')
    .requestedRetrievalType,
  'vector',
);
assert.equal(parseAiSearchProjectScopeMode(undefined), 'source');
assert.equal(parseAiSearchProjectScopeMode('source'), 'source');
assert.equal(parseAiSearchProjectScopeMode(' METADATA '), 'metadata');
assert.equal(parseAiSearchProjectScopeMode('Auto'), 'auto');
assert.equal(parseAiSearchProjectScopeMode('unsupported'), 'source');

assert.equal(normalizeAiSearchFolderRoot('/ai-index///'), '/ai-index');
assert.equal(
  normalizeAiSearchFolderRoot('https://prompt.example.com/ai-index///'),
  'https://prompt.example.com/ai-index',
);
assert.equal(
  resolveAiSearchFolderRoot(undefined, 'https://prompt.example.com/api/ai-search?q=x'),
  'https://prompt.example.com/ai-index',
);
assert.deepEqual(
  buildProjectFolderFilter('shadcn-ui-docs', 'https://prompt.example.com/ai-index'),
  {
    folder: {
      $gte: 'https://prompt.example.com/ai-index/shadcn-ui-docs/',
      $lt: 'https://prompt.example.com/ai-index/shadcn-ui-docs0',
    },
  },
);

assert.deepEqual(
  parseIndexedSourceKey(
    'https://prompt.example.com/ai-index/shadcn-ui-docs/components/button.md',
  ),
  {
    url: 'https://prompt.example.com/ai-index/shadcn-ui-docs/components/button.md',
    project: 'shadcn-ui-docs',
    path: '/components/button.md',
    apiPath: '/api/files/shadcn-ui-docs/components/button.md',
    viewerPath: '/p/shadcn-ui-docs/components/button.md',
    rawPath: '/raw/shadcn-ui-docs/components/button.md',
  },
);

assert.deepEqual(
  parseIndexedSourceKey(
    'https://prompt.example.com/raw/shadcn-ui-docs/components/button.md',
  ),
  {
    url: 'https://prompt.example.com/raw/shadcn-ui-docs/components/button.md',
    project: 'shadcn-ui-docs',
    path: '/components/button.md',
    apiPath: '/api/files/shadcn-ui-docs/components/button.md',
    viewerPath: '/p/shadcn-ui-docs/components/button.md',
    rawPath: '/raw/shadcn-ui-docs/components/button.md',
  },
);

assert.deepEqual(
  parseIndexedSourceKey(
    'https://prompt.example.com/api/files/shadcn-ui-docs/components/button.md',
  ),
  {
    url: 'https://prompt.example.com/api/files/shadcn-ui-docs/components/button.md',
    project: 'shadcn-ui-docs',
    path: '/components/button.md',
    apiPath: '/api/files/shadcn-ui-docs/components/button.md',
    viewerPath: '/p/shadcn-ui-docs/components/button.md',
    rawPath: '/raw/shadcn-ui-docs/components/button.md',
  },
);

const buttonChunk = {
  id: 'button-1',
  type: 'text',
  score: 0.91,
  text: 'Button component',
  item: {
    key: 'https://prompt.example.com/ai-index/shadcn-ui-docs/components/button.md',
    timestamp: 123,
    metadata: {
      folder: 'https://prompt.example.com/ai-index/shadcn-ui-docs/components/',
    },
  },
  scoring_details: { vector_score: 0.9 },
};
const sourceOnlyButtonChunk = {
  ...buttonChunk,
  id: 'button-source-only',
  item: {
    key: 'https://prompt.example.com/ai-index/shadcn-ui-docs/components/input.md',
    metadata: { schema_version: 2 },
  },
};
const duplicateButtonChunk = { ...buttonChunk, id: 'button-2', score: 0.8 };
const zustandChunk = {
  ...buttonChunk,
  id: 'zustand-1',
  item: {
    key: 'https://prompt.example.com/ai-index/zustand-docs/guide.md',
    metadata: { folder: 'https://prompt.example.com/ai-index/zustand-docs/' },
  },
};

assert.equal(
  chunkMatchesProject(
    buttonChunk,
    'shadcn-ui-docs',
    'https://prompt.example.com/ai-index',
  ),
  true,
);
assert.equal(
  chunkMatchesProject(
    sourceOnlyButtonChunk,
    'shadcn-ui-docs',
    'https://prompt.example.com/ai-index',
  ),
  true,
);
assert.equal(
  chunkMatchesProject(
    zustandChunk,
    'shadcn-ui-docs',
    'https://prompt.example.com/ai-index',
  ),
  false,
);

assert.deepEqual(
  formatAiSearchResults(
    [buttonChunk, duplicateButtonChunk, zustandChunk],
    { grouping: 'files', limit: 5, project: 'shadcn-ui-docs' },
    'https://prompt.example.com/ai-index',
  ),
  {
    results: [
      {
        id: 'button-1',
        type: 'text',
        score: 0.91,
        text: 'Button component',
        source: {
          key: 'https://prompt.example.com/ai-index/shadcn-ui-docs/components/button.md',
          url: 'https://prompt.example.com/ai-index/shadcn-ui-docs/components/button.md',
          project: 'shadcn-ui-docs',
          path: '/components/button.md',
          apiPath: '/api/files/shadcn-ui-docs/components/button.md',
          viewerPath: '/p/shadcn-ui-docs/components/button.md',
          rawPath: '/raw/shadcn-ui-docs/components/button.md',
          timestamp: 123,
          metadata: {
            folder: 'https://prompt.example.com/ai-index/shadcn-ui-docs/components/',
          },
        },
        scoringDetails: { vector_score: 0.9 },
      },
    ],
    excludedChunks: 1,
    duplicateChunks: 1,
  },
);

const sourceScopedResults = formatAiSearchResults(
  [zustandChunk, sourceOnlyButtonChunk],
  { grouping: 'files', limit: 5, project: 'shadcn-ui-docs' },
  'https://prompt.example.com/ai-index',
);
assert.equal(sourceScopedResults.results.length, 1);
assert.equal(sourceScopedResults.results[0]?.source.project, 'shadcn-ui-docs');
assert.equal(sourceScopedResults.excludedChunks, 1);

assert.throws(
  () => parseAiSearchRequest('https://prompt.example.com/api/ai-search?q=x&limit=100'),
  (error) => error instanceof AiSearchRequestError && error.code === 'invalid_limit',
);
assert.throws(
  () =>
    parseAiSearchRequest(
      'https://prompt.example.com/api/ai-search/one?q=x&project=two',
      'one',
    ),
  (error) => error instanceof AiSearchRequestError && error.code === 'project_conflict',
);

console.log('Cloudflare AI Search API tests passed.');
