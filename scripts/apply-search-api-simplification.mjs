import { readFile, writeFile } from 'node:fs/promises';

async function edit(path, transform) {
  const source = await readFile(path, 'utf8');
  const result = transform(source);
  if (result === source) throw new Error(`No changes applied to ${path}`);
  await writeFile(path, result);
}

function replaceRequired(source, pattern, replacement, label) {
  if (!pattern.test(source)) throw new Error(`Missing expected source block: ${label}`);
  return source.replace(pattern, replacement);
}

await edit('src/mcp/server.ts', (source) => {
  let next = replaceRequired(
    source,
    /const searchInputSchema = \{[\s\S]*?\n\};\n\nconst aiSearchInputSchema = \{[\s\S]*?\n\};/u,
    `const searchInputSchema = {
  query: z.string().trim().min(1).max(300),
  project: z.string().trim().max(100).optional(),
  limit: z.number().int().min(1).max(20).default(10),
};

const aiSearchInputSchema = {
  query: z.string().trim().min(1).max(1_000),
  project: z.string().trim().max(128).optional(),
  limit: z.number().int().min(1).max(20).default(10),
};`,
    'MCP search input schemas',
  );
  next = replaceRequired(
    next,
    /'Search D1 by exact text and structured filters such as project, directory, tags, language, visibility, and role\. Returns file metadata only; use fetch_file for content\. bm25Rank is the raw SQLite FTS5 BM25 rank, where smaller values rank earlier\. Prefer ai_search for natural-language semantic questions\.'/u,
    `'Search D1 by text, with an optional project scope and result limit. Returns file metadata only; use fetch_file for complete content. Prefer ai_search for natural-language semantic questions.'`,
    'search_files description',
  );
  next = replaceRequired(
    next,
    /'Search public indexed documentation with the same capability-aware Cloudflare AI Search logic as the web API\. auto selects an available mode; explicit hybrid or keyword requests return a structured retrieval_mode_unavailable error when the index does not support them\. Returns ranked Markdown snippets plus titles, prompt:\/\/ identifiers, raw URLs, and measured duration\. Use fetch_file to read a complete result\.'/u,
    `'Search public indexed documentation with fixed vector retrieval. Provide only the query, an optional project, and an optional result limit. Returns ranked Markdown snippets plus titles, prompt:// identifiers, raw URLs, and measured duration. Use fetch_file to read a complete result.'`,
    'ai_search description',
  );
  next = replaceRequired(
    next,
    /mode: z\.enum\(\['hybrid', 'keyword', 'vector'\]\),\n\s+group: z\.enum\(\['files', 'chunks'\]\),/u,
    `mode: z.literal('vector'),
          group: z.literal('files'),`,
    'AI search output meta schema',
  );
  return next;
});

await edit('src/services/ai-search-service.ts', (source) => {
  let next = replaceRequired(
    source,
    /export interface AiSearchInput \{[\s\S]*?\n\}/u,
    `export interface AiSearchInput {
  query: string;
  project?: string;
  limit?: number;
}`,
    'AiSearchInput interface',
  );
  next = replaceRequired(
    next,
    /export function createAiSearchRequestOptions\(input: AiSearchInput\): AiSearchRequestOptions \{[\s\S]*?\n\}/u,
    `export function createAiSearchRequestOptions(input: AiSearchInput): AiSearchRequestOptions {
  const url = new URL('/api/ai-search', 'https://prompt.local');
  url.searchParams.set('q', input.query);
  if (input.project) url.searchParams.set('project', input.project);
  if (input.limit !== undefined) url.searchParams.set('limit', String(input.limit));
  return parseAiSearchRequest(url.toString());
}`,
    'createAiSearchRequestOptions',
  );
  return next;
});

await edit('src/http/cloudflare-ai-search-utils.ts', (source) => {
  let next = replaceRequired(
    source,
    /function parseNumber\([\s\S]*?function parseGrouping\(value: string \| null\): AiSearchGrouping \{[\s\S]*?\n\}/u,
    '',
    'advanced AI search parameter parsers',
  );
  next = replaceRequired(
    next,
    /const query = normalizeOptionalText\(url\.searchParams\.get\('q'\) \?\? url\.searchParams\.get\('query'\)\);/u,
    `const query = normalizeOptionalText(url.searchParams.get('q'));`,
    'query alias parsing',
  );
  next = replaceRequired(
    next,
    /\n\s+const grouping = parseGrouping\(url\.searchParams\.get\('group'\)\);/u,
    '',
    'grouping parser call',
  );
  next = replaceRequired(
    next,
    /return \{\n\s+query,\n\s+project: routeProjectValue \?\? queryProjectValue,\n\s+requestedRetrievalType: parseRetrievalType\(url\.searchParams\.get\('mode'\)\),\n\s+grouping,\n\s+limit,\n\s+retrievalLimit: grouping === 'files' \? Math\.min\(50, limit \* 3\) : limit,\n\s+matchThreshold: parseNumber\([\s\S]*?\n\s+reranking: parseBoolean\(url\.searchParams\.get\('rerank'\), 'rerank', false\),\n\s+\};/u,
    `return {
    query,
    project: routeProjectValue ?? queryProjectValue,
    requestedRetrievalType: 'vector',
    grouping: 'files',
    limit,
    retrievalLimit: Math.min(50, limit * 3),
    matchThreshold: DEFAULT_AI_SEARCH_THRESHOLD,
    contextExpansion: DEFAULT_CONTEXT_EXPANSION,
    reranking: false,
  };`,
    'AI search parsed options',
  );
  return next;
});

await edit('src/http/cloudflare-ai-search.ts', (source) => {
  let next = replaceRequired(
    source,
    /schemaVersion: '1\.1'/u,
    `schemaVersion: '1.2'`,
    'AI search discovery schema version',
  );
  next = replaceRequired(
    next,
    /q: 'Required search text\. Alias: query\.'/u,
    `q: 'Required search text.'`,
    'AI search q description',
  );
  next = replaceRequired(
    next,
    /\n\s+mode:\n\s+'Accepted values: auto, hybrid, vector, or keyword\. Defaults to auto\. Explicit modes that are disabled on the current index return retrieval_mode_unavailable\.',\n\s+group: 'files or chunks\. Defaults to files\.',\n\s+threshold: '0-1\. Defaults to 0\.4\.',\n\s+context: '0-3 surrounding chunks\. Defaults to 0\.',\n\s+rerank: 'Boolean\. Defaults to false\.',/u,
    '',
    'advanced discovery parameters',
  );
  next = replaceRequired(
    next,
    /meta: 'Resolved retrieval mode, grouping, and duration_ms\.'/u,
    `meta: 'Fixed vector mode, file grouping, and duration_ms.'`,
    'AI search meta description',
  );
  return next;
});

await edit('docs/cloudflare-ai-search.md', (source) => {
  let next = replaceRequired(
    source,
    /\| `q` \| required \| Search text\. `query` is accepted as an alias\. \|/u,
    '| `q` | required | Search text. |',
    'AI search query parameter docs',
  );
  next = replaceRequired(
    next,
    /\n\| `mode`[\s\S]*?\| `rerank` \| `false` \| Enable or disable reranking\. \|/u,
    '',
    'advanced AI search parameter table rows',
  );
  next = replaceRequired(
    next,
    /The Worker reads the instance capabilities dynamically\. The default `auto` mode selects the best retrieval mode enabled by `ai-search-prompt`; explicitly requesting an unavailable mode returns a structured `retrieval_mode_unavailable` response\. Instance capabilities are cached in each Worker isolate for five minutes\./u,
    'Retrieval is fixed to `vector`. Results are grouped by source file with a match threshold of `0.4`, no context expansion, and reranking disabled. These are internal defaults and are not request parameters.',
    'AI search mode documentation',
  );
  return next;
});

await edit('scripts/test-mcp-contracts.mjs', (source) => {
  let next = replaceRequired(
    source,
    /assert\.match\(\n\s+source,\n\s+\/z\\\.enum\\\(\\\['auto', 'hybrid', 'vector', 'keyword'\\\]\\\)\\\.default\\\('auto'\\\)\/u,\n\);\nassert\.match\(source, \/rerank:\\s\+z\\\.boolean\\\(\\\)\\\.default\\\(false\\\)\/u\);\nassert\.match\(source, \/mode:\\s\+z\\\.enum\\\(\\\['hybrid', 'keyword', 'vector'\\\]\\\)\/u\);/u,
    `const aiSearchInput = source.match(/const aiSearchInputSchema = \\{([\\s\\S]*?)\\n\\};/u)?.[1] ?? '';
const fileSearchInput = source.match(/const searchInputSchema = \\{([\\s\\S]*?)\\n\\};/u)?.[1] ?? '';
assert.match(aiSearchInput, /query:/u);
assert.match(aiSearchInput, /project:/u);
assert.match(aiSearchInput, /limit:/u);
for (const removedParameter of ['mode', 'group', 'threshold', 'context', 'rerank']) {
  assert.doesNotMatch(aiSearchInput, new RegExp(\`\\\\b\${removedParameter}\\\\s*:\`, 'u'));
}
for (const removedFilter of ['directory', 'recursive', 'language', 'tags', 'visibility', 'promptRole']) {
  assert.doesNotMatch(fileSearchInput, new RegExp(\`\\\\b\${removedFilter}\\\\s*:\`, 'u'));
}
assert.match(source, /mode:\\s*z\\.literal\\('vector'\\)/u);
assert.match(source, /group:\\s*z\\.literal\\('files'\\)/u);`,
    'MCP advanced search contract assertions',
  );
  return next;
});

await edit('scripts/test-cloudflare-ai-search.mjs', (source) => {
  let next = replaceRequired(
    source,
    /'https:\/\/prompt\.example\.com\/api\/ai-search\/shadcn-ui-docs\?q=button&limit=5&mode=hybrid'/u,
    `'https://prompt.example.com/api/ai-search/shadcn-ui-docs?q=button&limit=5'`,
    'project-scoped AI search test URL',
  );
  next = replaceRequired(
    next,
    /requestedRetrievalType: 'hybrid'/u,
    `requestedRetrievalType: 'vector'`,
    'project-scoped retrieval type expectation',
  );
  next = replaceRequired(
    next,
    /requestedRetrievalType: 'auto'/u,
    `requestedRetrievalType: 'vector'`,
    'default retrieval type expectation',
  );
  next = replaceRequired(
    next,
    /assert\.equal\(parseAiSearchProjectScopeMode\(undefined\), 'source'\);/u,
    `assert.equal(
  parseAiSearchRequest('https://prompt.example.com/api/ai-search?q=x&mode=hybrid&group=chunks')
    .requestedRetrievalType,
  'vector',
);
assert.equal(parseAiSearchProjectScopeMode(undefined), 'source');`,
    'fixed vector regression assertion',
  );
  return next;
});

console.log('Applied search API simplification.');
