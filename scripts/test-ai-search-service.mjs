import assert from 'node:assert/strict';

import { AiSearchRequestError } from '../src/http/cloudflare-ai-search-utils.ts';
import { createAiSearchRequestOptions } from '../src/services/ai-search-service.ts';

assert.deepEqual(
  createAiSearchRequestOptions({
    query: 'how to use button',
    project: 'shadcn-ui-docs',
    limit: 6,
    mode: 'vector',
    group: 'chunks',
    threshold: 0.55,
    context: 2,
    rerank: true,
  }),
  {
    query: 'how to use button',
    project: 'shadcn-ui-docs',
    requestedRetrievalType: 'vector',
    grouping: 'chunks',
    limit: 6,
    retrievalLimit: 6,
    matchThreshold: 0.55,
    contextExpansion: 2,
    reranking: true,
  },
);

assert.deepEqual(createAiSearchRequestOptions({ query: 'padding' }), {
  query: 'padding',
  project: undefined,
  requestedRetrievalType: 'auto',
  grouping: 'files',
  limit: 10,
  retrievalLimit: 30,
  matchThreshold: 0.4,
  contextExpansion: 0,
  reranking: false,
});

assert.throws(
  () => createAiSearchRequestOptions({ query: 'padding', limit: 21 }),
  (error) => error instanceof AiSearchRequestError && error.code === 'invalid_limit',
);

console.log('Shared AI Search service contract tests passed.');
