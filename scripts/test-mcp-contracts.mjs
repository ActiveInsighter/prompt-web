import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/mcp/server.ts', import.meta.url), 'utf8');

assert.match(source, /registerTool\(\s*['"]ai_search['"]/u);
assert.match(source, /structuredContent:\s*value/u);
assert.equal((source.match(/outputSchema:/gu) ?? []).length, 9);

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
  'get_common_prompt',
]) {
  assert.match(source, new RegExp(`registerTool\\(\\s*['"]${tool}['"]`, 'u'));
}

console.log('MCP structured output contract tests passed.');
