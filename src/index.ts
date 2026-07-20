import { createMcpHandler } from 'agents/mcp';
import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { hasValidBearerToken, resolveAccessContext } from './auth';
import { contentSyncRequestSchema } from './content-sync/schema';
import { ContentSyncService } from './content-sync/service';
import { createPromptMcpServer } from './mcp/server';
import { PromptRepository } from './repositories/prompt-repository';
import type { Env, PromptRole, PromptSearchOptions, PromptVisibility } from './types';

const app = new Hono<{ Bindings: Env }>();
const MAX_CONTENT_SYNC_BODY_BYTES = 8_000_000;
type AppContext = Context<{ Bindings: Env }>;

app.use('*', logger());
app.use(
  '/api/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type'],
    maxAge: 86400,
  }),
);
app.use(
  '/raw*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'OPTIONS'],
    allowHeaders: ['Authorization'],
    maxAge: 86400,
  }),
);

function parseTags(values: string[] | undefined): string[] {
  return (values ?? [])
    .flatMap((tag) => tag.split(','))
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parseVisibility(value?: string): PromptVisibility | undefined {
  return value === 'public' || value === 'private' ? value : undefined;
}

function parsePromptRole(value?: string): PromptRole | undefined {
  return ['system', 'developer', 'user', 'template', 'reference'].includes(value ?? '')
    ? (value as PromptRole)
    : undefined;
}

function getServiceInfo() {
  return {
    service: 'prompt-library-mcp',
    version: '0.5.0',
    status: 'ok',
    endpoints: {
      frontend: '/',
      viewer: '/p/<project>/<path-to-file.md>',
      raw: '/raw/<project>/<path-to-file.md>',
      info: '/api/info',
      health: '/health',
      projects: '/api/projects',
      tree: '/api/tree?project=<slug>&path=/',
      search: '/api/files/search?q=<keywords>',
      fetch: '/api/files/fetch?identifier=<id-or-uri>',
      bootstrap: '/api/bootstrap/:client/:profile',
      contentSyncSnapshot: '/api/admin/library/snapshot',
      contentSync: '/api/admin/library/sync',
      mcp: '/mcp',
    },
  };
}

async function serveRawFile(context: AppContext, identifier: string) {
  const normalizedIdentifier = identifier.normalize('NFKC').trim();
  if (!normalizedIdentifier) {
    return context.json({ error: 'Missing Markdown file identifier.' }, 400);
  }

  const access = resolveAccessContext(context.req.raw, context.env.MCP_BEARER_TOKEN);
  const repository = new PromptRepository(context.env);
  const file = await repository.get(normalizedIdentifier, access);
  if (!file) return context.json({ error: 'Prompt file not found.' }, 404);

  const cacheControl =
    file.visibility === 'public'
      ? 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400'
      : 'private, no-store';

  return context.body(file.content, 200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    'Cache-Control': cacheControl,
    'X-Content-Type-Options': 'nosniff',
  });
}

async function readLimitedJson(request: Request): Promise<unknown> {
  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_CONTENT_SYNC_BODY_BYTES) {
    throw new RangeError('Content sync request exceeds the 8 MB limit.');
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_CONTENT_SYNC_BODY_BYTES) {
    throw new RangeError('Content sync request exceeds the 8 MB limit.');
  }
  return JSON.parse(body) as unknown;
}

app.get('/', (context) =>
  context.env.ASSETS.fetch(new URL('/index.html', context.req.url)),
);
app.get('/p', (context) =>
  context.env.ASSETS.fetch(new URL('/index.html', context.req.url)),
);
app.get('/p/*', (context) =>
  context.env.ASSETS.fetch(new URL('/index.html', context.req.url)),
);
app.get('/api/info', (context) => context.json(getServiceInfo()));

app.get('/health', async (context) => {
  const [database, projectCount, bootstrapManifest, latestContentSync] = await Promise.all([
    context.env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>(),
    context.env.DB.prepare(
      'SELECT COUNT(*) AS count FROM projects WHERE deleted_at IS NULL',
    ).first<{ count: number }>(),
    context.env.PROMPT_KV.get('manifest:bootstrap:chatgpt:default'),
    context.env.DB.prepare(
      `SELECT id, status, manifest_hash, started_at, finished_at
       FROM content_sync_runs
       ORDER BY started_at DESC
       LIMIT 1`,
    ).first<{
      id: string;
      status: string;
      manifest_hash: string;
      started_at: string;
      finished_at: string | null;
    }>(),
  ]);

  return context.json({
    status: database?.ok === 1 ? 'ok' : 'degraded',
    database: database?.ok === 1,
    projectCount: Number(projectCount?.count ?? 0),
    kvSeeded: Boolean(bootstrapManifest),
    contentSync: latestContentSync
      ? {
          runId: latestContentSync.id,
          status: latestContentSync.status,
          manifestHash: latestContentSync.manifest_hash,
          startedAt: latestContentSync.started_at,
          finishedAt: latestContentSync.finished_at,
        }
      : null,
    environment: context.env.ENVIRONMENT ?? 'unknown',
  });
});

app.get('/api/projects', async (context) => {
  const access = resolveAccessContext(context.req.raw, context.env.MCP_BEARER_TOKEN);
  const repository = new PromptRepository(context.env);
  return context.json({
    projects: await repository.listProjects(access),
    authenticated: access.authenticated,
  });
});

app.get('/api/tree', async (context) => {
  const project = context.req.query('project');
  if (!project) return context.json({ error: 'Missing project query parameter.' }, 400);

  const access = resolveAccessContext(context.req.raw, context.env.MCP_BEARER_TOKEN);
  const repository = new PromptRepository(context.env);
  const listing = await repository.listDirectory(project, context.req.query('path'), access);
  return listing ? context.json(listing) : context.json({ error: 'Directory not found.' }, 404);
});

app.get('/api/files/search', async (context) => {
  const access = resolveAccessContext(context.req.raw, context.env.MCP_BEARER_TOKEN);
  const options: PromptSearchOptions = {
    query: context.req.query('q'),
    project: context.req.query('project'),
    directory: context.req.query('directory'),
    recursive: context.req.query('recursive') !== 'false',
    language: context.req.query('language'),
    tags: parseTags(context.req.queries('tag')),
    visibility: parseVisibility(context.req.query('visibility')),
    promptRole: parsePromptRole(context.req.query('promptRole')),
    limit: Number(context.req.query('limit') ?? 10),
  };

  const repository = new PromptRepository(context.env);
  return context.json({
    results: await repository.search(options, access),
    authenticated: access.authenticated,
  });
});

app.get('/api/files/fetch', async (context) => {
  const identifier = context.req.query('identifier');
  if (!identifier) return context.json({ error: 'Missing identifier query parameter.' }, 400);

  const access = resolveAccessContext(context.req.raw, context.env.MCP_BEARER_TOKEN);
  const repository = new PromptRepository(context.env);
  const file = await repository.get(identifier, access);
  return file ? context.json(file) : context.json({ error: 'Prompt file not found.' }, 404);
});

app.get('/raw', async (context) => {
  const identifier = context.req.query('identifier');
  if (!identifier) return context.json({ error: 'Missing identifier query parameter.' }, 400);
  return serveRawFile(context, identifier);
});

app.get('/raw/:project/*', async (context) => {
  const project = context.req.param('project');
  const path = context.req.param('*');
  if (!project || !path) return context.json({ error: 'Missing project or file path.' }, 400);
  return serveRawFile(context, `prompt://${project}/${path}`);
});

app.get('/api/bootstrap/:client/:profile', async (context) => {
  const repository = new PromptRepository(context.env);
  const result = await repository.getBootstrapContext(
    context.req.param('client'),
    context.req.param('profile'),
  );
  return result ? context.json(result) : context.json({ error: 'Bootstrap context not found.' }, 404);
});

app.get('/api/admin/library/snapshot', async (context) => {
  if (!context.env.CONTENT_SYNC_TOKEN) {
    return context.json({ error: 'Content sync is not configured.' }, 503);
  }
  if (!hasValidBearerToken(context.req.raw, context.env.CONTENT_SYNC_TOKEN)) {
    return context.json({ error: 'Unauthorized.' }, 401);
  }

  const service = new ContentSyncService(context.env);
  return context.json(await service.snapshot());
});

app.post('/api/admin/library/sync', async (context) => {
  if (!context.env.CONTENT_SYNC_TOKEN) {
    return context.json({ error: 'Content sync is not configured.' }, 503);
  }
  if (!hasValidBearerToken(context.req.raw, context.env.CONTENT_SYNC_TOKEN)) {
    return context.json({ error: 'Unauthorized.' }, 401);
  }

  try {
    const payload = contentSyncRequestSchema.safeParse(await readLimitedJson(context.req.raw));
    if (!payload.success) {
      return context.json(
        {
          error: 'Invalid content manifest.',
          details: payload.error.flatten(),
        },
        400,
      );
    }

    const service = new ContentSyncService(context.env);
    return context.json(await service.sync(payload.data));
  } catch (error) {
    if (error instanceof RangeError) {
      return context.json({ error: error.message }, 413);
    }
    if (error instanceof SyntaxError) {
      return context.json({ error: 'Request body must be valid JSON.' }, 400);
    }
    throw error;
  }
});

// Compatibility routes for clients using the original flat prompt API.
app.get('/api/prompts/search', async (context) => {
  const access = resolveAccessContext(context.req.raw, context.env.MCP_BEARER_TOKEN);
  const options: PromptSearchOptions = {
    query: context.req.query('q'),
    project: context.req.query('project') ?? context.req.query('category'),
    directory: context.req.query('directory'),
    recursive: context.req.query('recursive') !== 'false',
    language: context.req.query('language'),
    tags: parseTags(context.req.queries('tag')),
    visibility: parseVisibility(context.req.query('visibility')),
    promptRole: parsePromptRole(context.req.query('promptRole')),
    limit: Number(context.req.query('limit') ?? 10),
  };

  const repository = new PromptRepository(context.env);
  return context.json({
    results: await repository.search(options, access),
    authenticated: access.authenticated,
  });
});

app.get('/api/prompts/:identifier', async (context) => {
  const access = resolveAccessContext(context.req.raw, context.env.MCP_BEARER_TOKEN);
  const repository = new PromptRepository(context.env);
  const file = await repository.get(context.req.param('identifier'), access);
  return file ? context.json(file) : context.json({ error: 'Prompt file not found.' }, 404);
});

app.all('/mcp', async (context) => {
  const access = resolveAccessContext(context.req.raw, context.env.MCP_BEARER_TOKEN);
  const handler = createMcpHandler(createPromptMcpServer(context.env, access), {
    route: '/mcp',
  });
  return handler(
    context.req.raw,
    context.env,
    context.executionCtx as unknown as ExecutionContext<unknown>,
  );
});

app.notFound((context) => context.json({ error: 'Not found.' }, 404));
app.onError((error, context) => {
  console.error('request_failed', error);
  return context.json({ error: 'Internal server error.' }, 500);
});

export default app;
