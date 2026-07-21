import type { Hono } from 'hono';
import type { Env } from '../types';
import { serializeAiSafeJson } from './ai-safe-json';
import {
  AiSearchRequestError,
  buildProjectFolderFilter,
  formatAiSearchResults,
  parseAiSearchRequest,
  type AiSearchChunkLike,
  type AiSearchRequestOptions,
} from './cloudflare-ai-search-utils';

type PromptApp = Hono<{ Bindings: Env }>;
type JsonStatus = 200 | 400 | 404 | 502 | 503;

interface PublicProjectRow {
  slug: string;
  name: string;
}

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
      project: 'Optional project slug on all-project endpoints.',
      limit: '1-20. Defaults to 10.',
      mode: 'hybrid, vector, or keyword. Defaults to hybrid.',
      group: 'files or chunks. Defaults to files.',
      threshold: '0-1. Defaults to 0.4.',
      context: '0-3 surrounding chunks. Defaults to 1.',
      rerank: 'Boolean. Defaults to true.',
    },
  });
}

async function resolvePublicProject(env: Env, identifier: string): Promise<PublicProjectRow | null> {
  return env.DB.prepare(
    `SELECT slug, name
     FROM projects
     WHERE deleted_at IS NULL
       AND visibility = 'public'
       AND (lower(slug) = lower(?) OR lower(id) = lower(?))
     LIMIT 1`,
  )
    .bind(identifier, identifier)
    .first<PublicProjectRow>();
}

function buildSearchRequest(
  options: AiSearchRequestOptions,
  project: PublicProjectRow | null,
  folderRoot?: string,
) {
  return {
    query: options.query,
    ai_search_options: {
      retrieval: {
        retrieval_type: options.retrievalType,
        max_num_results: options.retrievalLimit,
        match_threshold: options.matchThreshold,
        context_expansion: options.contextExpansion,
        keyword_match_mode: 'or' as const,
        return_on_failure: true,
        ...(project ? { filters: buildProjectFolderFilter(project.slug, folderRoot) } : {}),
      },
      query_rewrite: {
        enabled: false,
      },
      reranking: {
        enabled: options.reranking,
      },
    },
  };
}

async function handleAiSearch(
  request: Request,
  env: Env,
  routeProject?: string,
): Promise<Response> {
  let options: AiSearchRequestOptions;
  try {
    options = parseAiSearchRequest(request.url, routeProject);
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
    throw error;
  }

  if (!env.PROMPT_AI_SEARCH) {
    return jsonResponse(
      {
        schemaVersion: '1.0',
        error: {
          code: 'ai_search_unavailable',
          message: 'Cloudflare AI Search is not configured for this Worker.',
        },
      },
      503,
    );
  }

  const project = options.project ? await resolvePublicProject(env, options.project) : null;
  if (options.project && !project) {
    return jsonResponse(
      {
        schemaVersion: '1.0',
        error: {
          code: 'project_not_found',
          message: 'Public project not found.',
        },
      },
      404,
    );
  }

  const canonicalOptions: AiSearchRequestOptions = {
    ...options,
    project: project?.slug,
  };

  try {
    const searchResult = await env.PROMPT_AI_SEARCH.search(
      buildSearchRequest(canonicalOptions, project, env.AI_SEARCH_FOLDER_ROOT),
    );
    const chunks = searchResult.chunks as unknown as AiSearchChunkLike[];
    const formatted = formatAiSearchResults(
      chunks,
      canonicalOptions,
      env.AI_SEARCH_FOLDER_ROOT,
    );

    return jsonResponse({
      schemaVersion: '1.0',
      engine: 'cloudflare-ai-search',
      searchQuery: searchResult.search_query,
      query: {
        text: canonicalOptions.query,
        project: project
          ? {
              slug: project.slug,
              name: project.name,
            }
          : null,
        mode: canonicalOptions.retrievalType,
        group: canonicalOptions.grouping,
        limit: canonicalOptions.limit,
        threshold: canonicalOptions.matchThreshold,
        contextExpansion: canonicalOptions.contextExpansion,
        reranking: canonicalOptions.reranking,
      },
      count: formatted.results.length,
      results: formatted.results,
      diagnostics: {
        retrievedChunks: chunks.length,
        excludedChunks: formatted.excludedChunks,
        duplicateChunks: formatted.duplicateChunks,
      },
    });
  } catch (error) {
    console.error('cloudflare_ai_search_failed', {
      project: project?.slug ?? null,
      error,
    });
    return jsonResponse(
      {
        schemaVersion: '1.0',
        error: {
          code: 'ai_search_failed',
          message: 'Cloudflare AI Search request failed.',
        },
      },
      502,
    );
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
