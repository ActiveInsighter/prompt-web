import { readFile, writeFile } from 'node:fs/promises';

const diagnostic = await readFile('.github/apply-search-api-simplification.log', 'utf8');
if (!diagnostic.includes('Missing expected source block: MCP advanced search contract assertions')) {
  throw new Error(`Unexpected primary migration failure:\n${diagnostic}`);
}

const mcpTestPath = 'scripts/test-mcp-contracts.mjs';
let mcpTest = await readFile(mcpTestPath, 'utf8');
const assertionStart = mcpTest.indexOf("assert.match(\n  source,\n  /z\\.enum");
const assertionEndNeedle = "assert.match(source, /mode:\\s*z\\.enum\\(\\['hybrid', 'keyword', 'vector'\\]\\)/u);";
const assertionEnd = mcpTest.indexOf(assertionEndNeedle, assertionStart);
if (assertionStart < 0 || assertionEnd < 0) {
  throw new Error('Could not locate legacy MCP AI search assertions.');
}
const replacement = `const aiSearchInput = source.match(/const aiSearchInputSchema = \\{([\\s\\S]*?)\\n\\};/u)?.[1] ?? '';
const fileSearchInput = source.match(/const searchInputSchema = \\{([\\s\\S]*?)\\n\\};/u)?.[1] ?? '';
assert.match(aiSearchInput, /query:/u);
assert.match(aiSearchInput, /project:/u);
assert.match(aiSearchInput, /limit:/u);
for (const removedParameter of ['mode', 'group', 'threshold', 'context', 'rerank']) {
  assert.doesNotMatch(aiSearchInput, new RegExp('\\\\b' + removedParameter + '\\\\s*:', 'u'));
}
for (const removedFilter of ['directory', 'recursive', 'language', 'tags', 'visibility', 'promptRole']) {
  assert.doesNotMatch(fileSearchInput, new RegExp('\\\\b' + removedFilter + '\\\\s*:', 'u'));
}
assert.match(source, /mode:\\s*z\\.literal\\('vector'\\)/u);
assert.match(source, /group:\\s*z\\.literal\\('files'\\)/u);`;
mcpTest = `${mcpTest.slice(0, assertionStart)}${replacement}${mcpTest.slice(assertionEnd + assertionEndNeedle.length)}`;
await writeFile(mcpTestPath, mcpTest);

const apiTestPath = 'scripts/test-cloudflare-ai-search.mjs';
let apiTest = await readFile(apiTestPath, 'utf8');
apiTest = apiTest.replace(
  'https://prompt.example.com/api/ai-search/shadcn-ui-docs?q=button&limit=5&mode=hybrid',
  'https://prompt.example.com/api/ai-search/shadcn-ui-docs?q=button&limit=5',
);
apiTest = apiTest.replace("requestedRetrievalType: 'hybrid'", "requestedRetrievalType: 'vector'");
apiTest = apiTest.replace("requestedRetrievalType: 'auto'", "requestedRetrievalType: 'vector'");
const scopeAssertion = "assert.equal(parseAiSearchProjectScopeMode(undefined), 'source');";
if (!apiTest.includes(scopeAssertion)) throw new Error('Could not locate AI search scope assertion.');
apiTest = apiTest.replace(
  scopeAssertion,
  `assert.equal(
  parseAiSearchRequest('https://prompt.example.com/api/ai-search?q=x&mode=hybrid&group=chunks')
    .requestedRetrievalType,
  'vector',
);
${scopeAssertion}`,
);
await writeFile(apiTestPath, apiTest);

console.log('Completed search API simplification migration.');
