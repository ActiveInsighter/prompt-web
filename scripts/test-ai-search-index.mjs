import assert from 'node:assert/strict';

import {
  buildAiSearchRobotsTxt,
  buildAiSearchSitemap,
  buildRawFilePath,
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
    '<loc>https://prompt.example.com/raw/shadcn-ui-docs/components/progress.md</loc>',
  ),
);
assert.equal(sitemap.includes('/api/files'), false);
assert.equal(sitemap.includes('/raw/private-docs/secret.md'), false);
assert.ok(sitemap.includes('<lastmod>2026-07-20T12:30:00.000Z</lastmod>'));
assert.equal(sitemap.includes('/base/path'), false);

const robots = buildAiSearchRobotsTxt('https://prompt.example.com/anything');
assert.ok(robots.includes('User-agent: Cloudflare-AI-Search'));
assert.ok(robots.includes('Allow: /raw/'));
assert.ok(robots.includes('Disallow: /api/'));
assert.ok(robots.includes('Sitemap: https://prompt.example.com/sitemap.xml'));

console.log('AI Search indexing and trailing-slash tests passed.');
