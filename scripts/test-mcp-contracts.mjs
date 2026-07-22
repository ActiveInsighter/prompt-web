import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [source, indexSource, packageSource] = await Promise.all([
  readFile(new URL('../src/mcp/server.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/index.ts', import.meta.url), 'utf8'),
  readFile(new URL('../package.json', import.meta.url), 'utf8'),
]);
const packageVersion = JSON.parse(packageSource).version;
const mcpVersion = source.match(/new McpServer\(\{[\s\S]*?version:\s*['"]([^'"]+)['"]/u)?.[1];
const publicInfoVersion = indexSource.match(
  /service:\s*['"]prompt-library-mcp['"][\s\S]*?version:\s*['"]([^'"]+)['"]/u,
)?.[1];

assert.equal(mcpVersion, packageVersion, 'MCP version must match package.json.');
assert.equal(publicInfoVersion, packageVersion, '/api/info version must match package.json.');
assert.match(source, /registerTool\(\s*['"]ai_search['"]/u);
assert.match(source, /structuredContent:\s*value/u);
assert.match(source, /bm25Rank/u);
const aiSearchInput = source.match(/const aiSearchInputSchema = \{([\s\S]*?)\n\};/u)?.[1] ?? '';
const fileSearchInput = source.match(/const searchInputSchema = \{([\s\S]*?)\n\};/u)?.[1] ?? '';
assert.match(aiSearchInput, /query:/u);
assert.match(aiSearchInput, /project:/u);
assert.match(aiSearchInput, /limit:/u);
for (const removedParameter of ['mode', 'group', 'threshold', 'context', 'rerank']) {
  assert.doesNotMatch(aiSearchInput, new RegExp('\\b' + removedParameter + '\\s*:', 'u'));
}
for (const removedFilter of ['directory', 'recursive', 'language', 'tags', 'visibility', 'promptRole']) {
  assert.doesNotMatch(fileSearchInput, new RegExp('\\b' + removedFilter + '\\s*:', 'u'));
}
assert.match(source, /mode:\s*z\.literal\('vector'\)/u);
assert.match(source, /group:\s*z\.literal\('files'\)/u);
assert.equal((source.match(/outputSchema:/gu) ?? []).length, 10);

for (const legacyTool of ['search', 'fetch', 'list_categories']) {
  assert.equal(
    new RegExp(`registerTool\\(\\s*['"]${legacyTool}['"]`, 'u').test(source),
    false,
    `Legacy duplicate tool ${legacyTool} should not be registered.`,
  );
}

for (const tool of [
  'list_projects',
  'list_directory',
  'search_files',
  'ai_search',
  'fetch_file',
  'fetch_files',
  'render_prompt',
  'get_bootstrap_context',
  'list_common_prompts',
  'get_common_prompt',
]) {
  assert.match(source, new RegExp(`registerTool\\(\\s*['"]${tool}['"]`, 'u'));
}

console.log('MCP structured output contract tests passed.');
