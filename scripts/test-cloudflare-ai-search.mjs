import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  AiSearchRequestError,
  parseAiSearchRequest,
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
assert.match(serviceSource, /mapping\.replacement_instance_id/u);
assert.match(serviceSource, /projects\.flatMap\(projectInstanceIds\)/u);
assert.equal(
  wrangler.vars.PUBLIC_ORIGIN,
  'https://prompt.2212148739lbw.workers.dev',
  'MCP result URLs must use the deployed Worker origin.',
);

console.log('Cloudflare AI Search API tests passed');
