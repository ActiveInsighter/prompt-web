import { createMcpHandler } from 'agents/mcp';
import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { hasValidBearerToken, resolveAccessContext } from './auth';
import { contentSyncRequestSchema } from './content-sync/schema';
import { ContentSyncService } from './content-sync/service';
import { serializeAiSafeJson } from './http/ai-safe-json';
import { registerCloudflareAiSearchRoutes } from './http/cloudflare-ai-search';
import { normalizeTrailingSlashRequest } from './http/trailing-slash';
import { createPromptMcpServer } from './mcp/server';
import { PromptRepository } from './repositories/prompt-repository';
import {
  getAiSearchIndexStatus,
  processAiSearchJobs,
  reconcileAiSearchJobs,
} from './services/ai-search-indexing-service';
import type { Env, PromptRole, PromptSearchOptions, PromptVisibility } from './types';

const app = new Hono<{ Bindings: Env }>({ strict: false });
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

registerCloudflareAiSearchRoutes(app);

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

function getFileCacheControl(visibility: PromptVisibility): string {
  return visibility === 'public'
    ? 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400'
    : 'private, no-store';
}

function aiSafeJson(
  context: AppContext,
  value: unknown,
  status: 200 | 400 | 404 = 200,
  cacheControl = 'no-store',
) {
  return context.body(serializeAiSafeJson(value), status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': cacheControl,
    'X-Content-Type-Options': 'nosniff',
  });
}

function parseSearchOptions(context: AppContext): PromptSearchOptions {
  return {
    query: context.req.query('q'),
    project: context.req.query('project'),
    directory: context.req.query('path') ?? context.req.query('directory'),
    recursive: context.req.query('recursive') !== 'false',
    language: context.req.query('language'),
    tags: parseTags(context.req.queries('tag')),
    visibility: parseVisibility(context.req.query('visibility')),
    promptRole: parsePromptRole(
      context.req.query('role') ?? context.req.query('promptRole'),
    ),
    limit: Number(context.req.query('limit') ?? 10),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function parseSearchBody(value: unknown): PromptSearchOptions {
  const body = isRecord(value) ? value : {};
  const filters = isRecord(body.filters) ? body.filters : {};
  const options = isRecord(body.options) ? body.options : {};
  const tagsValue = filters.tags ?? body.tags;
  const tags = Array.isArray(tagsValue)
    ? tagsValue.filter((tag): tag is string => typeof tag === 'string')
    : [];

  return {
    query: optionalString(body.query) ?? optionalString(body.q),
    project:
      optionalString(filters.project) ??
      (Array.isArray(filters.projects) ? optionalString(filters.projects[0]) : undefined) ??
      optionalString(body.project),
    directory:
      optionalString(filters.pathPrefix) ??
      optionalString(filters.path) ??
      optionalString(body.path) ??
      optionalString(body.directory),
    recursive:
      typeof filters.recursive === 'boolean'
        ? filters.recursive
        : typeof body.recursive === 'boolean'
          ? body.recursive
          : true,
    language:
      optionalString(filters.language) ??
      (Array.isArray(filters.languages) ? optionalString(filters.languages[0]) : undefined) ??
      optionalString(body.language),
    tags,
    visibility: parseVisibility(
      optionalString(filters.visibility) ?? optionalString(body.visibility),
    ),
    promptRole: parsePromptRole(
      optionalString(filters.role) ??
        optionalString(body.role) ??
        optionalString(body.promptRole),
    ),
    limit: Number(options.limit ?? body.limit ?? 10),
  };
}

function getServiceInfo() {
  return {
    service: 'prompt-library-mcp',
    version: '0.9.0',
    status: 'ok',
    aiSearch: {
      storage: 'built-in-items',
      isolation: 'one-instance-per-project',
      synchronization: 'd1-outbox-and-cron',
    },
    endpoints: {
      frontend: '/',
      viewer: '/p/<project>/<path-to-file.md>',
      raw: '/raw/<project>/<path-to-file.md>',
      aiRoot: '/api/files',
      aiFile: '/api/files/<project>/<path-to-file.md>',
      aiResource: '/api/files/<project>/<optional-path>',
      v1Contents: '/api/v1/projects/<project>/contents/<optional-path>',
      info: '/api/info',
      health: '/health',
      projects: '/api/projects',
      v1Projects: '/api/v1/projects',
      tree: '/api/tree?project=<slug>&path=/',
      search: '/api/files/search?q=<keywords>',
      v1Search: '/api/v1/search?q=<keywords>',
      aiSearch: '/api/ai-search?q=<keywords>',
      aiSearchProject: '/api/ai-search/<project>?q=<keywords>',
      aiSearchInfo: '/api/ai-search/info',
      fetch: '/api/files/fetch?identifier=<id-or-uri>',
      bootstrap: '/api/bootstrap/:client/:profile',
      contentSyncSnapshot: '/api/admin/library/snapshot',
      contentSync: '/api/admin/library/sync',
      aiSearchStatus: '/api/admin/ai-search/status',
      aiSearchProcess: '/api/admin/ai-search/process',
      mcp: '/mcp',
    },
  };
}

function contentSyncAuthorizationError(context: AppContext): Response | null {
  if (!context.env.CONTENT_SYNC_TOKEN) {
    return context.json({ error: 'Content sync is not configured.' }, 503);
  }
  if (!hasValidBearerToken(context.req.raw, context.env.CONTENT_SYNC_TOKEN)) {
    return context.json({ error: 'Unauthorized.' }, 401);
  }
  return null;
}

function withPrimaryDatabaseSession(env: Env): Env {
  return {
    ...env,
    DB: env.DB.withSession('first-primary') as unknown as D1Database,
  };
}

async function runAiSearchMaintenance(env: Env, limit = 3) {
  const sessionEnv = withPrimaryDatabaseSession(env);
  const recovered = await reconcileAiSearchJobs(sessionEnv);
  return { recovered, ...(await processAiSearchJobs(sessionEnv, limit)) };
}

async function serveProjects(context: AppContext) {
  const access = resolveAccessContext(context.req.raw, context.env.MCP_BEARER_TOKEN);
  const repository = new PromptRepository(context.env);
  return aiSafeJson(context, {
    schemaVersion: '1.0',
    projects: await repository.listProjects(access),
    authenticated: access.authenticated,
  });
}

async function serveAiFilesRoot(context: AppContext) {
  const access = resolveAccessContext(context.req.raw, context.env.MCP_BEARER_TOKEN);
  const repository = new PromptRepository(context.env);
  const projects = await repository.listProjects(access);

  return aiSafeJson(
    context,
    {
      schemaVersion: '1.1',
      type: 'directory',
      path: '/',
      entries: projects.map((project) => ({
        type: 'project',
        id: project.id,
        slug: project.slug,
        name: project.name,
        description: project.description,
        visibility: project.visibility,
        defaultLanguage: project.defaultLanguage,
        path: `/${project.slug}`,
        uri: `prompt://${project.slug}/`,
        apiPath: `/api/files/${encodeURIComponent(project.slug)}`,
        updatedAt: project.updatedAt,
      })),
      semanticIndex: {
        engine: 'cloudflare-ai-search',
        storage: 'built-in-items',
        isolation: 'project-instance',
      },
      authenticated: access.authenticated,
    },
    200,
    access.authenticated
      ? 'private, no-store'
      : 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400',
  );
}

async function serveSearch(context: AppContext, options: PromptSearchOptions) {
  const access = resolveAccessContext(context.req.raw, context.env.MCP_BEARER_TOKEN);
  const repository = new PromptRepository(context.env);
  return aiSafeJson(context, {
    schemaVersion: '1.0',
    query: {
      text: options.query ?? '',
      project: options.project ?? null,
      path: options.directory ?? null,
      recursive: options.recursive !== false,
      language: options.language ?? null,
      tags: options.tags ?? [],
      visibility: options.visibility ?? null,
      role: options.promptRole ?? null,
      limit: Number.isFinite(options.limit) ? options.limit : 10,
    },
    results: await repository.search(options, access),
    authenticated: access.authenticated,
  });
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

  return context.body(file.content, 200, {
    'Content-Type': 'text/markdown; charset=utf-8',
    'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    'Cache-Control': getFileCacheControl(file.visibility),
    'X-Content-Type-Options': 'nosniff',
  });
}

async function serveAiSafeFile(context: AppContext, identifier: string) {
  const normalizedIdentifier = identifier.normalize('NFKC').trim();
  if (!normalizedIdentifier) return context.json({ error: 'Missing file identifier.' }, 400);
  const access = resolveAccessContext(context.req.raw, context.env.MCP_BEARER_TOKEN);
  const repository = new PromptRepository(context.env);
  const file = await repository.get(normalizedIdentifier, access);
  if (!file) return context.json({ error: 'Prompt file not found.' }, 404);
  return aiSafeJson(
    context,
    { schemaVersion: '1.0', type: 'file', ...file },
    200,
    getFileCacheControl(file.visibility),
  );
}

async function serveAiSafeResource(
  context: AppContext,
  projectIdentifier: string,
  requestedPath?: string,
) {
  const project = projectIdentifier.normalize('NFKC').trim();
  if (!project) return aiSafeJson(context, { error: 'Missing project identifier.' }, 400);
  const path = (requestedPath ?? '')
    .normalize('NFKC')
    .trim()
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
  const access = resolveAccessContext(context.req.raw, context.env.MCP_BEARER_TOKEN);
  const repository = new PromptRepository(context.env);

  if (path) {
    const file = await repository.get(`prompt://${project}/${path}`, access);
    if (file) {
      return aiSafeJson(
        context,
        { schemaVersion: '1.0', type: 'file', ...file },
        200,
        getFileCacheControl(file.visibility),
      );
    }
  }
  const directoryPath = path ? `/${path}` : '/';
  const listing = await repository.listDirectory(project, directoryPath, access);
  if (!listing) return aiSafeJson(context, { error: 'File or directory not found.' }, 404);
  return aiSafeJson(
    context,
    { schemaVersion: '1.0', type: 'directory', ...listing },
    200,
    getFileCacheControl(listing.project.visibility),
  );
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

app.get('/', (context) => context.env.ASSETS.fetch(new URL('/index.html', context.req.url)));
app.get('/p', (context) => context.env.ASSETS.fetch(new URL('/index.html', context.req.url)));
app.get('/p/*', (context) => context.env.ASSETS.fetch(new URL('/index.html', context.req.url)));
app.get('/api/info', (context) => context.json(getServiceInfo()));

app.get('/health', async (context) => {
  const [database, projectCount, bootstrapManifest, latestContentSync, aiSearch] = await Promise.all([
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
    getAiSearchIndexStatus(context.env),
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
    aiSearch: {
      projects: aiSearch.projects,
      items: aiSearch.items,
      jobs: aiSearch.jobs,
    },
    environment: context.env.ENVIRONMENT ?? 'unknown',
  });
});

app.get('/api/projects', serveProjects);
app.get('/api/v1/projects', serveProjects);
app.get('/api/tree', async (context) => {
  const project = context.req.query('project');
  if (!project) return context.json({ error: 'Missing project query parameter.' }, 400);
  const access = resolveAccessContext(context.req.raw, context.env.MCP_BEARER_TOKEN);
  const repository = new PromptRepository(context.env);
  const listing = await repository.listDirectory(project, context.req.query('path'), access);
  return listing ? context.json(listing) : context.json({ error: 'Directory not found.' }, 404);
});

app.get('/api/files', serveAiFilesRoot);
app.get('/api/files/search', (context) => serveSearch(context, parseSearchOptions(context)));
app.get('/api/v1/search', (context) => serveSearch(context, parseSearchOptions(context)));
app.post('/api/v1/search', async (context) => {
  try {
    return serveSearch(context, parseSearchBody(await context.req.json()));
  } catch {
    return aiSafeJson(context, { error: 'Request body must be valid JSON.' }, 400);
  }
});
app.get('/api/files/fetch', async (context) => {
  const identifier = context.req.query('identifier');
  if (!identifier) return context.json({ error: 'Missing identifier query parameter.' }, 400);
  return serveAiSafeFile(context, identifier);
});
app.get('/api/files/:project', (context) =>
  serveAiSafeResource(context, context.req.param('project')),
);
app.get('/api/files/:project/:path{.+}', (context) =>
  serveAiSafeResource(context, context.req.param('project'), context.req.param('path')),
);
app.get('/api/v1/projects/:project/contents', (context) =>
  serveAiSafeResource(context, context.req.param('project')),
);
app.get('/api/v1/projects/:project/contents/:path{.+}', (context) =>
  serveAiSafeResource(context, context.req.param('project'), context.req.param('path')),
);

app.get('/raw', async (context) => {
  const identifier = context.req.query('identifier');
  if (!identifier) return context.json({ error: 'Missing identifier query parameter.' }, 400);
  return serveRawFile(context, identifier);
});
app.get('/raw/:project/:path{.+}', (context) =>
  serveRawFile(context, `prompt://${context.req.param('project')}/${context.req.param('path')}`),
);

app.get('/api/bootstrap/:client/:profile', async (context) => {
  const repository = new PromptRepository(context.env);
  const result = await repository.getBootstrapContext(
    context.req.param('client'),
    context.req.param('profile'),
  );
  return result ? context.json(result) : context.json({ error: 'Bootstrap context not found.' }, 404);
});

app.get('/api/admin/library/snapshot', async (context) => {
  const authorizationError = contentSyncAuthorizationError(context);
  if (authorizationError) return authorizationError;
  return context.json(await new ContentSyncService(context.env).snapshot());
});

app.post('/api/admin/library/sync', async (context) => {
  const authorizationError = contentSyncAuthorizationError(context);
  if (authorizationError) return authorizationError;
  try {
    const payload = contentSyncRequestSchema.safeParse(await readLimitedJson(context.req.raw));
    if (!payload.success) {
      return context.json(
        { error: 'Invalid content manifest.', details: payload.error.flatten() },
        400,
      );
    }
    const result = await new ContentSyncService(context.env).sync(payload.data);
    context.executionCtx.waitUntil(runAiSearchMaintenance(context.env, 3));
    return context.json(result);
  } catch (error) {
    if (error instanceof RangeError) return context.json({ error: error.message }, 413);
    if (error instanceof SyntaxError) {
      return context.json({ error: 'Request body must be valid JSON.' }, 400);
    }
    throw error;
  }
});

app.get('/api/admin/ai-search/status', async (context) => {
  const authorizationError = contentSyncAuthorizationError(context);
  if (authorizationError) return authorizationError;
  return context.json(
  await getAiSearchIndexStatus(withPrimaryDatabaseSession(context.env)),
);
});

app.post('/api/admin/ai-search/process', async (context) => {
  const authorizationError = contentSyncAuthorizationError(context);
  if (authorizationError) return authorizationError;
  const requestedLimit = Number(context.req.query('limit') ?? 3);
  return context.json(await runAiSearchMaintenance(context.env, requestedLimit));
});

// Compatibility routes for clients using the original flat prompt API.
app.get('/api/prompts/search', (context) => {
  const options = parseSearchOptions(context);
  options.project = options.project ?? context.req.query('category');
  return serveSearch(context, options);
});
app.get('/api/prompts/:identifier', (context) =>
  serveAiSafeFile(context, context.req.param('identifier')),
);

app.all('/mcp', async (context) => {
  const access = resolveAccessContext(context.req.raw, context.env.MCP_BEARER_TOKEN);
  const handler = createMcpHandler(createPromptMcpServer(context.env, access), { route: '/mcp' });
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

export default {
  fetch(request, env, executionContext) {
    return app.fetch(normalizeTrailingSlashRequest(request), env, executionContext);
  },
  scheduled(_controller, env, executionContext) {
    executionContext.waitUntil(runAiSearchMaintenance(env, 3));
  },
} satisfies ExportedHandler<Env>;
