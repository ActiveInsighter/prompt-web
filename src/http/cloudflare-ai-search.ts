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
    schemaVersion: '1.0',
    service: 'cloudflare-ai-search',
    engine: 'Cloudflare AI Search',
    endpoints: {
      allProjects: '/api/ai-search?q=<query>',
      oneProject: '/api/ai-search/<project>?q=<query>',
      v1AllProjects: '/api/v1/ai-search?q=<query>',
      v1OneProject: '/api/v1/projects/<project>/ai-search?q=<query>',
    },
    parameters: {
      q: 'Required search text. Alias: query.',
      project: 'Optional public project slug.',
      limit: '1-20. Defaults to 10.',
      mode: 'auto, hybrid, vector, or keyword. Defaults to auto.',
      group: 'files or chunks. Defaults to files.',
      threshold: '0-1. Defaults to 0.4.',
      context: '0-3 surrounding chunks. Defaults to 0.',
      rerank: 'Boolean. Defaults to false.',
    },
    output: {
      query: 'Normalized search text.',
      project: 'Project slug or null.',
      count: 'Number of results.',
      results: 'score, text, project, path, uri, and raw URL.',
    },
  });
}

function errorResponse(error: AiSearchServiceError): Response {
  return jsonResponse(
    {
      schemaVersion: '1.0',
      error: {
        code: error.code,
        message: error.message,
        ...error.details,
      },
    },
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
      return jsonResponse(
        {
          schemaVersion: '1.0',
          error: {
            code: error.code,
            message: error.message,
          },
        },
        400,
      );
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
