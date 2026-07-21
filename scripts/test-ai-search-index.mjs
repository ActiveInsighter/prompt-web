import assert from 'node:assert/strict';

import {
  buildAiIndexDirectoryHtml,
  buildAiIndexRootHtml,
} from '../src/http/ai-index.ts';
import {
  buildAiIndexFilePath,
  buildAiSearchRobotsTxt,
  buildAiSearchSitemap,
  buildRawFilePath,
  escapeAiIndexContent,
} from '../src/http/ai-search-index.ts';
import {
  normalizeTrailingSlashRequest,
  stripTrailingSlashes,
} from '../src/http/trailing-slash.ts';

assert.equal(stripTrailingSlashes('/'), '/');
assert.equal(stripTrailingSlashes('/api/files/'), '/api/files');
assert.equal(stripTrailingSlashes('/api/files///'), '/api/files');
assert.equal(stripTrailingSlashes('/api/files/shadcn-ui-docs'), '/api/files/shadcn-ui-docs');

const postRequest = new Request('https://prompt.example.com/api/v1/search/?q=progress', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: '{"query":"progress"}',
});
const normalizedPostRequest = normalizeTrailingSlashRequest(postRequest);
assert.equal(new URL(normalizedPostRequest.url).pathname, '/api/v1/search');
assert.equal(new URL(normalizedPostRequest.url).search, '?q=progress');
assert.equal(normalizedPostRequest.method, 'POST');
assert.equal(await normalizedPostRequest.text(), '{"query":"progress"}');

const unchangedRequest = new Request('https://prompt.example.com/api/files');
assert.equal(normalizeTrailingSlashRequest(unchangedRequest), unchangedRequest);

assert.equal(
  buildRawFilePath('shadcn-ui-docs', '/components/button.md'),
  '/raw/shadcn-ui-docs/components/button.md',
);
assert.equal(
  buildRawFilePath('中文 文档', '/组件/按钮 & 标签.md'),
  '/raw/%E4%B8%AD%E6%96%87%20%E6%96%87%E6%A1%A3/%E7%BB%84%E4%BB%B6/%E6%8C%89%E9%92%AE%20%26%20%E6%A0%87%E7%AD%BE.md',
);
assert.equal(
  buildAiIndexFilePath('shadcn-ui-docs', '/components/progress.md'),
  '/ai-index/shadcn-ui-docs/components/progress.md',
);
assert.equal(
  buildAiIndexFilePath('中文 文档', '/组件/按钮 & 标签.md'),
  '/ai-index/%E4%B8%AD%E6%96%87%20%E6%96%87%E6%A1%A3/%E7%BB%84%E4%BB%B6/%E6%8C%89%E9%92%AE%20%26%20%E6%A0%87%E7%AD%BE.md',
);

const escapedIndexContent = escapeAiIndexContent(
  '<CodeTabs>\n<TabsTrigger value="manual">Manual & advanced</TabsTrigger>',
);
assert.equal(
  escapedIndexContent,
  '\\u003cCodeTabs\\u003e\n\\u003cTabsTrigger value="manual"\\u003eManual & advanced\\u003c/TabsTrigger\\u003e',
);
assert.equal(escapedIndexContent.includes('<CodeTabs>'), false);
assert.equal(escapedIndexContent.includes('\n'), true);
assert.equal(escapedIndexContent.includes('&'), true);
assert.equal(escapedIndexContent.includes('{'), false);

const expressionHeavyTag = `<Button
  disabled={value > 0}
  onClick={() => value < 10 ? <Icon /> : null}
>
  Save
</Button>`;
assert.equal(
  escapeAiIndexContent(expressionHeavyTag),
  `\\u003cButton
  disabled={value > 0}
  onClick={() => value < 10 ? \\u003cIcon /\\u003e : null}
 \\u003e
  Save
\\u003c/Button\\u003e`,
);

assert.equal(escapeAiIndexContent('x < y && a > b'), 'x < y && a > b');
assert.equal(
  escapeAiIndexContent('(value) => setValue(value >= 0 ? value : 0)'),
  '(value) => setValue(value >= 0 ? value : 0)',
);
assert.equal(
  escapeAiIndexContent('const identity = <T>(value: T): T => value'),
  'const identity = <T>(value: T): T => value',
);
assert.equal(escapeAiIndexContent('type Result = Promise<T>'), 'type Result = Promise<T>');
assert.equal(
  escapeAiIndexContent('<https://example.com/docs?q=a>b>'),
  '<https://example.com/docs?q=a>b>',
);
assert.equal(escapeAiIndexContent('<br>'), '\\u003cbr\\u003e');
assert.equal(
  escapeAiIndexContent('<>value</>'),
  '\\u003c\\u003evalue\\u003c/\\u003e',
);
assert.equal(
  escapeAiIndexContent('<!-- keep <Button> literal -->'),
  '\\u003c!-- keep \\u003cButton\\u003e literal --\\u003e',
);

const project = {
  id: 'project-1',
  slug: 'shadcn-ui-docs',
  name: 'shadcn/ui Docs',
  description: 'Component documentation with <MDX> examples.',
  visibility: 'public',
  defaultLanguage: 'en',
  metadata: {},
  createdAt: '2026-07-20T12:00:00Z',
  updatedAt: '2026-07-20T12:30:00Z',
};

const rootHtml = buildAiIndexRootHtml('https://prompt.example.com/ignored/path', [project]);
assert.ok(rootHtml.includes('<link rel="canonical" href="https://prompt.example.com/ai-index">'));
assert.ok(rootHtml.includes('href="https://prompt.example.com/ai-index/shadcn-ui-docs"'));
assert.ok(rootHtml.includes('Component documentation with &lt;MDX&gt; examples.'));
assert.equal(rootHtml.includes('/api/files/shadcn-ui-docs'), false);

const directoryHtml = buildAiIndexDirectoryHtml('https://prompt.example.com', {
  project,
  path: '/components',
  entries: [
    {
      id: 'folder-1',
      projectId: project.id,
      parentId: null,
      type: 'folder',
      name: 'forms',
      path: '/components/forms',
      depth: 2,
      sortOrder: 0,
      visibility: null,
      updatedAt: '2026-07-20T12:30:00Z',
    },
    {
      id: 'file-1',
      projectId: project.id,
      parentId: null,
      type: 'file',
      name: 'button.md',
      path: '/components/button.md',
      depth: 2,
      sortOrder: 1,
      visibility: null,
      title: 'Button <API>',
      description: 'Button documentation.',
      language: 'en',
      promptRole: 'reference',
      updatedAt: '2026-07-20T12:30:00Z',
    },
  ],
});
assert.ok(directoryHtml.includes('href="https://prompt.example.com/ai-index/shadcn-ui-docs"'));
assert.ok(
  directoryHtml.includes(
    'href="https://prompt.example.com/ai-index/shadcn-ui-docs/components/button.md"',
  ),
);
assert.ok(directoryHtml.includes('Button &lt;API&gt;'));
assert.ok(directoryHtml.includes('Parent directory'));

const sitemap = buildAiSearchSitemap(
  'https://prompt.example.com/base/path?ignored=true',
  [{ slug: 'shadcn-ui-docs', updatedAt: '2026-07-20T12:00:00Z' }],
  [
    {
      projectSlug: 'shadcn-ui-docs',
      path: '/components/progress.md',
      updatedAt: '2026-07-20T12:30:00Z',
    },
    {
      projectSlug: 'private-docs',
      path: '/secret.md',
      updatedAt: '2026-07-20T12:30:00Z',
    },
  ],
);
assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/u);
assert.ok(
  sitemap.includes(
    '<loc>https://prompt.example.com/ai-index/shadcn-ui-docs/components/progress.md</loc>',
  ),
);
assert.equal(sitemap.includes('/api/files'), false);
assert.equal(sitemap.includes('/raw/shadcn-ui-docs/components/progress.md'), false);
assert.equal(sitemap.includes('/ai-index/private-docs/secret.md'), false);
assert.ok(sitemap.includes('<lastmod>2026-07-20T12:30:00.000Z</lastmod>'));
assert.equal(sitemap.includes('/base/path'), false);

const robots = buildAiSearchRobotsTxt('https://prompt.example.com/anything');
assert.ok(robots.includes('User-agent: Cloudflare-AI-Search'));
assert.ok(robots.includes('Allow: /ai-index/'));
assert.ok(robots.includes('Disallow: /raw/'));
assert.ok(robots.includes('Disallow: /api/'));
assert.ok(robots.includes('Sitemap: https://prompt.example.com/sitemap.xml'));

console.log('AI Search indexing and trailing-slash tests passed.');
