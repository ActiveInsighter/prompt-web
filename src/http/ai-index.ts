import type { Context, Hono } from 'hono';
import { resolveAccessContext } from '../auth';
import { PromptRepository } from '../repositories/prompt-repository';
import type { Env, PromptVisibility } from '../types';
import {
  AI_INDEX_ROOT,
  buildAiIndexDirectoryHtml,
  buildAiIndexRootHtml,
} from './ai-index-html';
import { escapeAiIndexContent } from './ai-search-index';

type PromptApp = Hono<{ Bindings: Env }>;
type AppContext = Context<{ Bindings: Env }>;

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
  app.get(AI_INDEX_ROOT, serveAiIndexRoot);
  app.get(`${AI_INDEX_ROOT}/:project`, (context) =>
    serveAiIndexResource(context, context.req.param('project')),
  );
  app.get(`${AI_INDEX_ROOT}/:project/:path{.+}`, (context) =>
    serveAiIndexResource(
      context,
      context.req.param('project'),
      context.req.param('path'),
    ),
  );
}
