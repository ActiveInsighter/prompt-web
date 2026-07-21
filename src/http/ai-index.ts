import type { Context, Hono } from 'hono';
import { resolveAccessContext } from '../auth';
import { PromptRepository } from '../repositories/prompt-repository';
import type {
  DirectoryListing,
  Env,
  ProjectRecord,
  PromptVisibility,
} from '../types';
import { escapeAiIndexContent } from './ai-search-index';

type PromptApp = Hono<{ Bindings: Env }>;
type AppContext = Context<{ Bindings: Env }>;

const AI_INDEX_ROOT = '/ai-index';

function getFileCacheControl(visibility: PromptVisibility): string {
  return visibility === 'public'
    ? 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400'
    : 'private, no-store';
}

function getListingCacheControl(authenticated: boolean, visibility?: PromptVisibility): string {
  return authenticated || visibility === 'private'
    ? 'private, no-store'
    : 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400';
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/gu, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return character;
    }
  });
}

function encodePath(path: string): string {
  return path
    .replace(/^\/+|\/+$/gu, '')
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function buildAiIndexPath(projectSlug?: string, path?: string): string {
  if (!projectSlug) return AI_INDEX_ROOT;

  const project = encodeURIComponent(projectSlug.normalize('NFKC').trim());
  const encodedPath = encodePath(path ?? '');
  return encodedPath
    ? `${AI_INDEX_ROOT}/${project}/${encodedPath}`
    : `${AI_INDEX_ROOT}/${project}`;
}

function absoluteUrl(origin: string, path: string): string {
  return new URL(path, origin).toString();
}

function htmlPage(
  title: string,
  canonicalUrl: string,
  content: string,
  robots: 'index,follow' | 'noindex,nofollow' = 'index,follow',
): string {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    `  <meta name="robots" content="${robots}">`,
    `  <title>${escapeHtml(title)}</title>`,
    `  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">`,
    '</head>',
    '<body>',
    '  <main>',
    content,
    '  </main>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

export function buildAiIndexRootHtml(origin: string, projects: ProjectRecord[]): string {
  const canonicalUrl = absoluteUrl(origin, AI_INDEX_ROOT);
  const projectItems = projects
    .map((project) => {
      const projectUrl = absoluteUrl(origin, buildAiIndexPath(project.slug));
      const description = project.description
        ? `\n        <p>${escapeHtml(project.description)}</p>`
        : '';
      return [
        '      <li>',
        `        <a href="${escapeHtml(projectUrl)}">${escapeHtml(project.name)}</a>`,
        `        <code>${escapeHtml(project.slug)}</code>${description}`,
        '      </li>',
      ].join('\n');
    })
    .join('\n');

  const sitemapUrl = absoluteUrl(origin, '/sitemap.xml');
  return htmlPage(
    'Prompt AI index',
    canonicalUrl,
    [
      '    <h1>Prompt AI index</h1>',
      '    <p>This crawl-only directory links to every indexable public project and document.</p>',
      `    <p><a href="${escapeHtml(sitemapUrl)}">XML sitemap</a></p>`,
      '    <ul>',
      projectItems || '      <li>No indexable projects are currently available.</li>',
      '    </ul>',
    ].join('\n'),
  );
}

function parentDirectoryPath(path: string): string {
  const segments = path.replace(/^\/+|\/+$/gu, '').split('/').filter(Boolean);
  segments.pop();
  return segments.length > 0 ? `/${segments.join('/')}` : '/';
}

export function buildAiIndexDirectoryHtml(origin: string, listing: DirectoryListing): string {
  const { project, path, entries } = listing;
  const canonicalPath = buildAiIndexPath(project.slug, path === '/' ? undefined : path);
  const canonicalUrl = absoluteUrl(origin, canonicalPath);
  const rootUrl = absoluteUrl(origin, AI_INDEX_ROOT);
  const projectUrl = absoluteUrl(origin, buildAiIndexPath(project.slug));

  const navigation = [
    `    <p><a href="${escapeHtml(rootUrl)}">All projects</a></p>`,
    path === '/'
      ? ''
      : `    <p><a href="${escapeHtml(
          absoluteUrl(origin, buildAiIndexPath(project.slug, parentDirectoryPath(path))),
        )}">Parent directory</a></p>`,
  ]
    .filter(Boolean)
    .join('\n');

  const entryItems = entries
    .map((entry) => {
      const entryUrl = absoluteUrl(origin, buildAiIndexPath(project.slug, entry.path));
      const label = entry.title || entry.name;
      const kind = entry.type === 'folder' ? 'Directory' : 'Document';
      const description = entry.description
        ? `\n        <p>${escapeHtml(entry.description)}</p>`
        : '';
      return [
        '      <li>',
        `        <span>${kind}:</span> <a href="${escapeHtml(entryUrl)}">${escapeHtml(label)}</a>`,
        `        <code>${escapeHtml(entry.path)}</code>${description}`,
        '      </li>',
      ].join('\n');
    })
    .join('\n');

  return htmlPage(
    `${project.name} AI index${path === '/' ? '' : ` — ${path}`}`,
    canonicalUrl,
    [
      `    <h1><a href="${escapeHtml(projectUrl)}">${escapeHtml(project.name)}</a></h1>`,
      `    <p>Project slug: <code>${escapeHtml(project.slug)}</code></p>`,
      `    <p>Directory: <code>${escapeHtml(path)}</code></p>`,
      navigation,
      '    <ul>',
      entryItems || '      <li>This directory is empty.</li>',
      '    </ul>',
    ]
      .filter(Boolean)
      .join('\n'),
  );
}

function htmlResponse(
  context: AppContext,
  html: string,
  cacheControl: string,
  indexable: boolean,
): Response {
  return context.body(html, 200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': cacheControl,
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': indexable ? 'index, follow' : 'noindex, nofollow',
  });
}

async function serveAiIndexRoot(context: AppContext): Promise<Response> {
  const access = resolveAccessContext(context.req.raw, context.env.MCP_BEARER_TOKEN);
  const repository = new PromptRepository(context.env);
  const projects = await repository.listProjects(access);
  const publicProjects = access.authenticated
    ? projects
    : projects.filter((project) => project.visibility === 'public');

  return htmlResponse(
    context,
    buildAiIndexRootHtml(new URL(context.req.url).origin, publicProjects),
    getListingCacheControl(access.authenticated),
    !access.authenticated,
  );
}

async function serveAiIndexFile(
  context: AppContext,
  identifier: string,
): Promise<Response | null> {
  const normalizedIdentifier = identifier.normalize('NFKC').trim();
  if (!normalizedIdentifier) return null;

  const access = resolveAccessContext(context.req.raw, context.env.MCP_BEARER_TOKEN);
  const repository = new PromptRepository(context.env);
  const file = await repository.get(normalizedIdentifier, access);
  if (!file) return null;

  return context.body(escapeAiIndexContent(file.content), 200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    'Cache-Control': getFileCacheControl(file.visibility),
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': file.visibility === 'public' ? 'index, follow' : 'noindex, nofollow',
  });
}

async function serveAiIndexResource(
  context: AppContext,
  projectIdentifier: string,
  requestedPath?: string,
): Promise<Response> {
  const project = projectIdentifier.normalize('NFKC').trim();
  if (!project) return context.text('Missing project identifier.', 400);

  const path = (requestedPath ?? '')
    .normalize('NFKC')
    .trim()
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');

  if (path) {
    const fileResponse = await serveAiIndexFile(context, `prompt://${project}/${path}`);
    if (fileResponse) return fileResponse;
  }

  const access = resolveAccessContext(context.req.raw, context.env.MCP_BEARER_TOKEN);
  const repository = new PromptRepository(context.env);
  const directoryPath = path ? `/${path}` : '/';
  const listing = await repository.listDirectory(project, directoryPath, access);
  if (!listing) return context.text('Prompt file or directory not found.', 404);

  return htmlResponse(
    context,
    buildAiIndexDirectoryHtml(new URL(context.req.url).origin, listing),
    getListingCacheControl(access.authenticated, listing.project.visibility),
    !access.authenticated && listing.project.visibility === 'public',
  );
}

export function registerAiIndexRoutes(app: PromptApp): void {
  app.get('/ai-index', serveAiIndexRoot);
  app.get('/ai-index/:project', (context) =>
    serveAiIndexResource(context, context.req.param('project')),
  );
  app.get('/ai-index/:project/:path{.+}', (context) =>
    serveAiIndexResource(
      context,
      context.req.param('project'),
      context.req.param('path'),
    ),
  );
}
