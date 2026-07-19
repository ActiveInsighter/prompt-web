import { createMcpHandler } from 'agents/mcp';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { resolveAccessContext } from './auth';
import { createPromptMcpServer } from './mcp/server';
import { PromptRepository } from './repositories/prompt-repository';
import type { Env, PromptRole, PromptSearchOptions, PromptVisibility } from './types';

const app = new Hono<{ Bindings: Env }>();

app.use('*', logger());
app.use(
  '/api/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type'],
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

app.get('/', (context) =>
  context.json({
    service: 'prompt-library-mcp',
    version: '0.3.0',
    status: 'ok',
    endpoints: {
      health: '/health',
      projects: '/api/projects',
      tree: '/api/tree?project=<slug>&path=/',
      search: '/api/files/search?q=<keywords>',
      fetch: '/api/files/fetch?identifier=<id-or-uri>',
      bootstrap: '/api/bootstrap/:client/:profile',
      mcp: '/mcp',
    },
  }),
);

app.get('/health', async (context) => {
  const [database, projectCount, bootstrapManifest] = await Promise.all([
    context.env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>(),
    context.env.DB.prepare(
      'SELECT COUNT(*) AS count FROM projects WHERE deleted_at IS NULL',
    ).first<{ count: number }>(),
    context.env.PROMPT_KV.get('manifest:bootstrap:chatgpt:default'),
  ]);

  return context.json({
    status: database?.ok === 1 ? 'ok' : 'degraded',
    database: database?.ok === 1,
    projectCount: Number(projectCount?.count ?? 0),
    kvSeeded: Boolean(bootstrapManifest),
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

app.get('/api/bootstrap/:client/:profile', async (context) => {
  const repository = new PromptRepository(context.env);
  const result = await repository.getBootstrapContext(
    context.req.param('client'),
    context.req.param('profile'),
  );
  return result ? context.json(result) : context.json({ error: 'Bootstrap context not found.' }, 404);
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
