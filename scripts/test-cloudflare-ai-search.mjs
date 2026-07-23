import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  AiSearchRequestError,
  orderAiSearchResults,
  parseAiSearchRequest,
  resolveExplicitAiSearchRetrievalType,
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

assert.equal(resolveExplicitAiSearchRetrievalType('auto'), undefined);
assert.equal(resolveExplicitAiSearchRetrievalType('hybrid'), 'hybrid');

const cloudflareOrder = [
  { id: 'reranked-first', score: 0.2, scoringDetails: { reranking_score: 0.9 } },
  { id: 'reranked-second', score: 0.95, scoringDetails: { reranking_score: 0.1 } },
];
assert.deepEqual(
  orderAiSearchResults([...cloudflareOrder], {
    reranking: true,
    requiresMergedRanking: false,
  }).map((result) => result.id),
  ['reranked-first', 'reranked-second'],
  'A single Cloudflare reranked response must retain its upstream order.',
);
assert.deepEqual(
  orderAiSearchResults(
    [
      { id: 'raw-high', score: 0.95, scoringDetails: { reranking_score: 0.2 } },
      { id: 'rerank-high', score: 0.3, scoringDetails: { reranking_score: 0.9 } },
      { id: 'fallback-score', score: 0.8, scoringDetails: null },
    ],
    { reranking: true, requiresMergedRanking: true },
  ).map((result) => result.id),
  ['rerank-high', 'fallback-score', 'raw-high'],
  'Multiple Cloudflare response batches must merge by reranking_score with score fallback.',
);
assert.deepEqual(
  orderAiSearchResults([...cloudflareOrder], {
    reranking: false,
    requiresMergedRanking: false,
  }).map((result) => result.id),
  ['reranked-second', 'reranked-first'],
  'Non-reranked results must continue to sort by the upstream score.',
);

assert.deepEqual(
  parseAiSearchRequest(
    'https://prompt.example.com/api/ai-search?q=%E5%8F%98%E9%99%90%E7%A7%AF%E5%88%86&group=chunks&limit=20&mode=vector&threshold=0.25&context=2&rerank=true',
  ),
  {
    query: '变限积分',
    project: undefined,
    requestedRetrievalType: 'vector',
    grouping: 'chunks',
    limit: 20,
    retrievalLimit: 20,
    matchThreshold: 0.25,
    contextExpansion: 2,
    reranking: true,
  },
  'CJK queries and explicit retrieval controls must be preserved',
);

assert.throws(
  () => parseAiSearchRequest('https://prompt.example.com/api/ai-search?q=x&limit=100'),
  (error) => error instanceof AiSearchRequestError && error.code === 'invalid_limit',
);
assert.throws(
  () => parseAiSearchRequest('https://prompt.example.com/api/ai-search?q=x&mode=semantic'),
  (error) => error instanceof AiSearchRequestError && error.code === 'invalid_mode',
);
assert.throws(
  () =>
    parseAiSearchRequest(
      'https://prompt.example.com/api/ai-search/one?q=x&project=two',
      'one',
    ),
  (error) => error instanceof AiSearchRequestError && error.code === 'project_conflict',
);
assert.throws(
  () => parseAiSearchRequest('https://prompt.example.com/api/ai-search'),
  (error) => error instanceof AiSearchRequestError && error.code === 'missing_query',
);

const [serviceSource, wranglerSource] = await Promise.all([
  readFile(new URL('../src/services/ai-search-service.ts', import.meta.url), 'utf8'),
  readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'),
]);
const wrangler = JSON.parse(wranglerSource);
assert.doesNotMatch(serviceSource, /prompt\.local/u, 'MCP results must not expose prompt.local URLs.');
assert.doesNotMatch(
  serviceSource,
  /requested === 'auto' \? 'vector'/u,
  'auto retrieval must not be forced to vector.',
);
assert.match(
  serviceSource,
  /\.\.\.\(retrievalType\s*\?\s*\{ retrieval_type: retrievalType \}\s*:\s*\{\}\)/u,
  'auto retrieval must omit retrieval_type from the Cloudflare request.',
);
assert.match(serviceSource, /mapping\.replacement_instance_id/u);
assert.match(serviceSource, /projects\.flatMap\(projectInstanceIds\)/u);
assert.equal(
  wrangler.vars.PUBLIC_ORIGIN,
  'https://prompt.2212148739lbw.workers.dev',
  'MCP result URLs must use the deployed Worker origin.',
);

console.log('Cloudflare AI Search API tests passed');
