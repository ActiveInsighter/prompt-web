import type { Hono } from 'hono';
import {
  AiSearchServiceError,
  searchAiDocuments,
} from '../services/ai-search-service';
import type { Env } from '../types';
import { serializeAiSafeJson } from './ai-safe-json';
import {
  AiSearchRequestError,
  parseAiSearchRequest,
} from './cloudflare-ai-search-utils';

type PromptApp = Hono<{ Bindings: Env }>;
type JsonStatus = 200 | 400 | 404 | 502 | 503;

function jsonResponse(value: unknown, status: JsonStatus = 200): Response {
  return new Response(serializeAiSafeJson(value), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function discoveryResponse(): Response {
  return jsonResponse({
    schemaVersion: '1.2',
    service: 'cloudflare-ai-search',
    engine: 'Cloudflare AI Search',
    endpoints: {
      allProjects: '/api/ai-search?q=<query>',
      oneProject: '/api/ai-search/<project>?q=<query>',
      v1AllProjects: '/api/v1/ai-search?q=<query>',
      v1OneProject: '/api/v1/projects/<project>/ai-search?q=<query>',
    },
    parameters: {
      q: 'Required search text.',
      project: 'Optional public project slug.',
      limit: '1-20. Defaults to 10.',
    },
    output: {
      query: 'Normalized search text.',
      project: 'Project slug or null.',
      count: 'Number of results.',
      results: 'score, title, text, project, path, uri, and raw URL.',
      meta: 'Fixed vector mode, file grouping, and duration_ms.',
    },
    errors: {
      shape: '{ ok: false, error: { code, message, retryable, upstream_status?, details? } }',
    },
  });
}

function structuredError(
  code: string,
  message: string,
  options: {
    retryable?: boolean;
    upstreamStatus?: number;
    details?: Record<string, unknown>;
  } = {},
) {
  return {
    ok: false,
    error: {
      code,
      message,
      retryable: options.retryable ?? false,
      ...(options.upstreamStatus !== undefined
        ? { upstream_status: options.upstreamStatus }
        : {}),
      ...(options.details ? { details: options.details } : {}),
    },
  };
}

function errorResponse(error: AiSearchServiceError): Response {
  const upstreamStatus =
    typeof error.details?.upstreamStatus === 'number'
      ? error.details.upstreamStatus
      : undefined;
  return jsonResponse(
    structuredError(error.code, error.message, {
      retryable: error.status >= 500,
      upstreamStatus,
      details: error.details,
    }),
    error.status,
  );
}

async function handleAiSearch(
  request: Request,
  env: Env,
  routeProject?: string,
): Promise<Response> {
  try {
    const options = parseAiSearchRequest(request.url, routeProject);
    return jsonResponse(await searchAiDocuments(env, options, request.url));
  } catch (error) {
    if (error instanceof AiSearchRequestError) {
      return jsonResponse(structuredError(error.code, error.message), 400);
    }
    if (error instanceof AiSearchServiceError) return errorResponse(error);
    throw error;
  }
}

export function registerCloudflareAiSearchRoutes(app: PromptApp): void {
  app.get('/api/ai-search/info', () => discoveryResponse());
  app.get('/api/ai-search', (context) => handleAiSearch(context.req.raw, context.env));
  app.get('/api/ai-search/:project', (context) =>
    handleAiSearch(context.req.raw, context.env, context.req.param('project')),
  );

  app.get('/api/v1/ai-search', (context) => handleAiSearch(context.req.raw, context.env));
  app.get('/api/v1/projects/:project/ai-search', (context) =>
    handleAiSearch(context.req.raw, context.env, context.req.param('project')),
  );
}
