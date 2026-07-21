import type { Context, Hono } from 'hono';
import { resolveAccessContext } from '../auth';
import { PromptRepository } from '../repositories/prompt-repository';
import type { Env, PromptVisibility } from '../types';
import { escapeAiIndexContent } from './ai-search-index';

type PromptApp = Hono<{ Bindings: Env }>;
type AppContext = Context<{ Bindings: Env }>;

function getFileCacheControl(visibility: PromptVisibility): string {
  return visibility === 'public'
    ? 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400'
    : 'private, no-store';
}

async function serveAiIndexFile(context: AppContext, identifier: string) {
  const normalizedIdentifier = identifier.normalize('NFKC').trim();
  if (!normalizedIdentifier) {
    return context.text('Missing Markdown file identifier.', 400);
  }

  const access = resolveAccessContext(context.req.raw, context.env.MCP_BEARER_TOKEN);
  const repository = new PromptRepository(context.env);
  const file = await repository.get(normalizedIdentifier, access);
  if (!file) return context.text('Prompt file not found.', 404);

  return context.body(escapeAiIndexContent(file.content), 200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    'Cache-Control': getFileCacheControl(file.visibility),
    'X-Content-Type-Options': 'nosniff',
  });
}

export function registerAiIndexRoutes(app: PromptApp): void {
  app.get('/ai-index/:project/:path{.+}', (context) => {
    const project = context.req.param('project');
    const path = context.req.param('path');
    return serveAiIndexFile(context, `prompt://${project}/${path}`);
  });
}
