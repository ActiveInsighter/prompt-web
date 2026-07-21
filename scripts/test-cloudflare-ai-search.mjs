import assert from 'node:assert/strict';

import {
  AiSearchRequestError,
  buildProjectFolderFilter,
  chunkMatchesProject,
  formatAiSearchResults,
  normalizeAiSearchFolderRoot,
  parseAiSearchRequest,
  parseIndexedSourceKey,
  resolveAiSearchFolderRoot,
} from '../src/http/cloudflare-ai-search-utils.ts';

assert.deepEqual(
  parseAiSearchRequest(
    'https://prompt.example.com/api/ai-search/shadcn-ui-docs?q=button&limit=5&mode=hybrid',
    'shadcn-ui-docs',
  ),
  {
    query: 'button',
    project: 'shadcn-ui-docs',
    requestedRetrievalType: 'hybrid',
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
    requestedRetrievalType: 'auto',
    grouping: 'files',
    limit: 10,
    retrievalLimit: 30,
    matchThreshold: 0.4,
    contextExpansion: 0,
    reranking: false,
  },
);

assert.equal(normalizeAiSearchFolderRoot('/api//files///'), '/api/files');
assert.equal(
  normalizeAiSearchFolderRoot('https://prompt.example.com/api//files///'),
  'https://prompt.example.com/api/files',
);
assert.equal(
  resolveAiSearchFolderRoot(undefined, 'https://prompt.example.com/api/ai-search?q=x'),
  'https://prompt.example.com/api/files',
);
assert.deepEqual(
  buildProjectFolderFilter(
    'shadcn-ui-docs',
    'https://prompt.example.com/api/files',
  ),
  {
    folder: {
      $gte: 'https://prompt.example.com/api/files/shadcn-ui-docs/',
      $lt: 'https://prompt.example.com/api/files/shadcn-ui-docs0',
    },
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
    key: 'https://prompt.example.com/api/files/shadcn-ui-docs/components/button.md',
    timestamp: 123,
    metadata: {
      folder: 'https://prompt.example.com/api/files/shadcn-ui-docs/components/',
    },
  },
  scoring_details: { vector_score: 0.9 },
};
const duplicateButtonChunk = { ...buttonChunk, id: 'button-2', score: 0.8 };
const zustandChunk = {
  ...buttonChunk,
  id: 'zustand-1',
  item: {
    key: 'https://prompt.example.com/api/files/zustand-docs/guide.md',
    metadata: { folder: 'https://prompt.example.com/api/files/zustand-docs/' },
  },
};

assert.equal(
  chunkMatchesProject(
    buttonChunk,
    'shadcn-ui-docs',
    'https://prompt.example.com/api/files',
  ),
  true,
);
assert.equal(
  chunkMatchesProject(
    zustandChunk,
    'shadcn-ui-docs',
    'https://prompt.example.com/api/files',
  ),
  false,
);

assert.deepEqual(
  formatAiSearchResults(
    [buttonChunk, duplicateButtonChunk, zustandChunk],
    { grouping: 'files', limit: 5, project: 'shadcn-ui-docs' },
    'https://prompt.example.com/api/files',
  ),
  {
    results: [
      {
        id: 'button-1',
        type: 'text',
        score: 0.91,
        text: 'Button component',
        source: {
          key: 'https://prompt.example.com/api/files/shadcn-ui-docs/components/button.md',
          url: 'https://prompt.example.com/api/files/shadcn-ui-docs/components/button.md',
          project: 'shadcn-ui-docs',
          path: '/components/button.md',
          apiPath: '/api/files/shadcn-ui-docs/components/button.md',
          viewerPath: '/p/shadcn-ui-docs/components/button.md',
          rawPath: '/raw/shadcn-ui-docs/components/button.md',
          timestamp: 123,
          metadata: {
            folder: 'https://prompt.example.com/api/files/shadcn-ui-docs/components/',
          },
        },
        scoringDetails: { vector_score: 0.9 },
      },
    ],
    excludedChunks: 1,
    duplicateChunks: 1,
  },
);

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
