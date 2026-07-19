import { createMcpHandler } from 'agents/mcp';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { resolveAccessContext } from './auth';
import { createPromptMcpServer } from './mcp/server';
import { PromptRepository } from './repositories/prompt-repository';
import type { Env, PromptSearchOptions, PromptVisibility } from './types';

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

app.get('/', (context) =>
  context.json({
    service: 'prompt-library-mcp',
    status: 'ok',
    endpoints: {
      health: '/health',
      search: '/api/prompts/search',
      fetch: '/api/prompts/:identifier',
      mcp: '/mcp',
    },
  }),
);

app.get('/health', async (context) => {
  const [database, kvIndex] = await Promise.all([
    context.env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>(),
    context.env.PROMPT_KV.get('index:public'),
  ]);

  return context.json({
    status: database?.ok === 1 ? 'ok' : 'degraded',
    database: database?.ok === 1,
    kvSeeded: Boolean(kvIndex),
    environment: context.env.ENVIRONMENT ?? 'unknown',
  });
});

app.get('/api/prompts/search', async (context) => {
  const access = resolveAccessContext(context.req.raw, context.env.MCP_BEARER_TOKEN);
  const visibility = context.req.query('visibility');
  const options: PromptSearchOptions = {
    query: context.req.query('q'),
    category: context.req.query('category'),
    language: context.req.query('language'),
    tags: (context.req.queries('tag') ?? [])
      .flatMap((tag) => tag.split(','))
      .map((tag) => tag.trim())
      .filter(Boolean),
    visibility: ['public', 'private', 'system'].includes(visibility ?? '')
      ? (visibility as PromptVisibility)
      : undefined,
    limit: Number(context.req.query('limit') ?? 10),
  };

  const repository = new PromptRepository(context.env);
  const results = await repository.search(options, access);
  return context.json({ results, authenticated: access.authenticated });
});

app.get('/api/prompts/:identifier', async (context) => {
  const access = resolveAccessContext(context.req.raw, context.env.MCP_BEARER_TOKEN);
  const repository = new PromptRepository(context.env);
  const prompt = await repository.get(context.req.param('identifier'), access);
  return prompt ? context.json(prompt) : context.json({ error: 'Prompt not found.' }, 404);
});

app.all('/mcp', async (context) => {
  const access = resolveAccessContext(context.req.raw, context.env.MCP_BEARER_TOKEN);
  const handler = createMcpHandler(createPromptMcpServer(context.env, access), {
    route: '/mcp',
  });
  return handler(context.req.raw, context.env, context.executionCtx);
});

app.notFound((context) => context.json({ error: 'Not found.' }, 404));
app.onError((error, context) => {
  console.error('request_failed', error);
  return context.json({ error: 'Internal server error.' }, 500);
});

export default app;
