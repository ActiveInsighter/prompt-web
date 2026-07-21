import type { Hono } from 'hono';
import type { Env } from '../types';
import { serializeAiSafeJson } from './ai-safe-json';
import {
  AiSearchRequestError,
  buildProjectFolderFilter,
  formatAiSearchResults,
  parseAiSearchRequest,
  resolveAiSearchFolderRoot,
  type AiSearchChunkLike,
  type AiSearchRequestOptions,
  type AiSearchRetrievalType,
} from './cloudflare-ai-search-utils';

type PromptApp = Hono<{ Bindings: Env }>;
type JsonStatus = 200 | 400 | 404 | 502 | 503;

interface PublicProjectRow {
  slug: string;
  name: string;
}

interface AiSearchCapabilities {
  vector: boolean;
  keyword: boolean;
  source: 'instance' | 'fallback';
}

interface CachedCapabilities {
  value: AiSearchCapabilities;
  expiresAt: number;
}

const CAPABILITIES_CACHE_TTL_MS = 5 * 60 * 1_000;
let cachedCapabilities: CachedCapabilities | undefined;

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
      mode: 'auto, hybrid, vector, or keyword. Defaults to auto.',
      group: 'files or chunks. Defaults to files.',
      threshold: '0-1. Defaults to 0.4.',
      context: '0-3 surrounding chunks. Defaults to 0.',
      rerank: 'Boolean. Defaults to false.',
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function getAiSearchCapabilities(env: Env): Promise<AiSearchCapabilities> {
  const now = Date.now();
  if (cachedCapabilities && cachedCapabilities.expiresAt > now) {
    return cachedCapabilities.value;
  }

  try {
    const info = await env.PROMPT_AI_SEARCH.info();
    const infoRecord: Record<string, unknown> = isRecord(info) ? info : {};
    const indexMethodValue = infoRecord.index_method ?? infoRecord.indexMethod;
    const indexMethod = isRecord(indexMethodValue) ? indexMethodValue : {};
    const capabilities: AiSearchCapabilities = {
      vector: indexMethod.vector !== false,
      keyword: indexMethod.keyword === true,
      source: 'instance',
    };
    cachedCapabilities = {
      value: capabilities,
      expiresAt: now + CAPABILITIES_CACHE_TTL_MS,
    };
    return capabilities;
  } catch (error) {
    console.warn('cloudflare_ai_search_info_failed', error);
    const fallback: AiSearchCapabilities = {
      vector: true,
      keyword: false,
      source: 'fallback',
    };
    cachedCapabilities = {
      value: fallback,
      expiresAt: now + 30_000,
    };
    return fallback;
  }
}

function resolveRetrievalType(
  options: AiSearchRequestOptions,
  capabilities: AiSearchCapabilities,
): AiSearchRetrievalType | null {
  const requested = options.requestedRetrievalType;
  if (requested === 'auto') {
    if (capabilities.vector && capabilities.keyword) return 'hybrid';
    if (capabilities.keyword) return 'keyword';
    return capabilities.vector ? 'vector' : null;
  }
  if (requested === 'hybrid') {
    return capabilities.vector && capabilities.keyword ? 'hybrid' : null;
  }
  if (requested === 'keyword') {
    return capabilities.keyword ? 'keyword' : null;
  }
  return capabilities.vector ? 'vector' : null;
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
  retrievalType: AiSearchRetrievalType,
  project: PublicProjectRow | null,
  folderRoot: string,
) {
  return {
    messages: [{ role: 'user' as const, content: options.query }],
    ai_search_options: {
      retrieval: {
        retrieval_type: retrievalType,
        max_num_results: options.retrievalLimit,
        match_threshold: options.matchThreshold,
        return_on_failure: true,
        ...(options.contextExpansion > 0
          ? { context_expansion: options.contextExpansion }
          : {}),
        ...(project ? { filters: buildProjectFolderFilter(project.slug, folderRoot) } : {}),
      },
      ...(options.reranking
        ? {
            reranking: {
              enabled: true,
            },
          }
        : {}),
    },
  };
}

async function runSearch(
  env: Env,
  options: AiSearchRequestOptions,
  retrievalType: AiSearchRetrievalType,
  project: PublicProjectRow | null,
  folderRoot: string,
) {
  return env.PROMPT_AI_SEARCH.search(
    buildSearchRequest(options, retrievalType, project, folderRoot),
  );
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
  const capabilities = await getAiSearchCapabilities(env);
  const retrievalType = resolveRetrievalType(canonicalOptions, capabilities);
  if (!retrievalType) {
    return jsonResponse(
      {
        schemaVersion: '1.0',
        error: {
          code: 'retrieval_mode_unavailable',
          message: `The requested ${canonicalOptions.requestedRetrievalType} retrieval mode is not enabled for this AI Search instance.`,
          availableModes: [
            ...(capabilities.vector ? ['vector'] : []),
            ...(capabilities.keyword ? ['keyword'] : []),
            ...(capabilities.vector && capabilities.keyword ? ['hybrid'] : []),
          ],
        },
      },
      400,
    );
  }

  const folderRoot = resolveAiSearchFolderRoot(env.AI_SEARCH_FOLDER_ROOT, request.url);
  let effectiveRetrievalType = retrievalType;
  let fallbackFrom: AiSearchRetrievalType | null = null;

  try {
    let searchResult;
    try {
      searchResult = await runSearch(
        env,
        canonicalOptions,
        effectiveRetrievalType,
        project,
        folderRoot,
      );
    } catch (error) {
      const canFallback =
        canonicalOptions.requestedRetrievalType === 'auto' &&
        effectiveRetrievalType !== 'vector' &&
        capabilities.vector;
      if (!canFallback) throw error;

      console.warn('cloudflare_ai_search_mode_fallback', {
        from: effectiveRetrievalType,
        to: 'vector',
        error,
      });
      fallbackFrom = effectiveRetrievalType;
      effectiveRetrievalType = 'vector';
      searchResult = await runSearch(
        env,
        canonicalOptions,
        effectiveRetrievalType,
        project,
        folderRoot,
      );
    }

    const chunks = searchResult.chunks as unknown as AiSearchChunkLike[];
    const formatted = formatAiSearchResults(chunks, canonicalOptions, folderRoot);

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
        requestedMode: canonicalOptions.requestedRetrievalType,
        mode: effectiveRetrievalType,
        group: canonicalOptions.grouping,
        limit: canonicalOptions.limit,
        threshold: canonicalOptions.matchThreshold,
        contextExpansion: canonicalOptions.contextExpansion,
        reranking: canonicalOptions.reranking,
      },
      count: formatted.results.length,
      results: formatted.results,
      diagnostics: {
        capabilities,
        folderRoot,
        retrievedChunks: chunks.length,
        excludedChunks: formatted.excludedChunks,
        duplicateChunks: formatted.duplicateChunks,
        fallbackFrom,
      },
    });
  } catch (error) {
    console.error('cloudflare_ai_search_failed', {
      project: project?.slug ?? null,
      requestedMode: canonicalOptions.requestedRetrievalType,
      resolvedMode: effectiveRetrievalType,
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
