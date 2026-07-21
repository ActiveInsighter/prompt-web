import {
  compactAiSearchPayload,
  type CompactAiSearchResponse,
} from '../http/ai-safe-json';
import {
  MAX_AI_SEARCH_QUERY_LENGTH,
  buildProjectFolderFilter,
  formatAiSearchResults,
  parseAiSearchProjectScopeMode,
  parseAiSearchRequest,
  resolveAiSearchFolderRoot,
  type AiSearchChunkLike,
  type AiSearchGrouping,
  type AiSearchProjectScopeMode,
  type AiSearchRequestOptions,
  type AiSearchRequestedRetrievalType,
  type AiSearchRetrievalType,
} from '../http/cloudflare-ai-search-utils';
import type { Env } from '../types';

type AiSearchBindingResult = Awaited<ReturnType<AiSearchInstance['search']>>;

interface PublicProjectRow {
  slug: string;
  name: string;
}

interface AiSearchCapabilities {
  vector: boolean;
  keyword: boolean;
}

interface CachedCapabilities {
  value: AiSearchCapabilities;
  expiresAt: number;
}

interface SearchOutcome {
  searchResult: AiSearchBindingResult;
  chunks: AiSearchChunkLike[];
  formatted: ReturnType<typeof formatAiSearchResults>;
}

export interface AiSearchInput {
  query: string;
  project?: string;
  limit?: number;
  mode?: AiSearchRequestedRetrievalType;
  group?: AiSearchGrouping;
  threshold?: number;
  context?: number;
  rerank?: boolean;
}

export class AiSearchServiceError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: 400 | 404 | 502 | 503,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AiSearchServiceError';
  }
}

const CAPABILITIES_CACHE_TTL_MS = 5 * 60 * 1_000;
const MAX_PROJECT_SCOPE_RETRIEVAL_RESULTS = 50;
let cachedCapabilities: CachedCapabilities | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function resolveMcpRequestUrl(env: Env): string {
  const configuredRoot = env.AI_SEARCH_FOLDER_ROOT?.normalize('NFKC').trim();
  if (configuredRoot) {
    try {
      return new URL('/api/ai-search', configuredRoot).toString();
    } catch {
      // Relative folder roots are valid; the placeholder origin is only used as a parser base.
    }
  }
  return 'https://prompt.local/api/ai-search';
}

export function createAiSearchRequestOptions(input: AiSearchInput): AiSearchRequestOptions {
  const url = new URL('/api/ai-search', 'https://prompt.local');
  url.searchParams.set('q', input.query);
  if (input.project) url.searchParams.set('project', input.project);
  if (input.limit !== undefined) url.searchParams.set('limit', String(input.limit));
  if (input.mode) url.searchParams.set('mode', input.mode);
  if (input.group) url.searchParams.set('group', input.group);
  if (input.threshold !== undefined) url.searchParams.set('threshold', String(input.threshold));
  if (input.context !== undefined) url.searchParams.set('context', String(input.context));
  if (input.rerank !== undefined) url.searchParams.set('rerank', String(input.rerank));
  return parseAiSearchRequest(url.toString());
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
    };
    cachedCapabilities = {
      value: capabilities,
      expiresAt: now + CAPABILITIES_CACHE_TTL_MS,
    };
    return capabilities;
  } catch (error) {
    console.warn('cloudflare_ai_search_info_failed', error);
    const fallback: AiSearchCapabilities = { vector: true, keyword: false };
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
  queryText = options.query,
) {
  return {
    messages: [{ role: 'user' as const, content: queryText }],
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
  queryText = options.query,
): Promise<AiSearchBindingResult> {
  return env.PROMPT_AI_SEARCH.search(
    buildSearchRequest(options, retrievalType, project, folderRoot, queryText),
  );
}

function createOutcome(
  searchResult: AiSearchBindingResult,
  options: AiSearchRequestOptions,
  folderRoot: string,
): SearchOutcome {
  const chunks = searchResult.chunks as unknown as AiSearchChunkLike[];
  return {
    searchResult,
    chunks,
    formatted: formatAiSearchResults(chunks, options, folderRoot),
  };
}

function buildProjectHintedQuery(query: string, project: PublicProjectRow): string {
  const suffix = `\nProject: ${project.name}\nProject slug: ${project.slug}`;
  const availableLength = Math.max(1, MAX_AI_SEARCH_QUERY_LENGTH - suffix.length);
  return `${query.slice(0, availableLength)}${suffix}`;
}

function broadProjectOptions(options: AiSearchRequestOptions): AiSearchRequestOptions {
  return {
    ...options,
    retrievalLimit: MAX_PROJECT_SCOPE_RETRIEVAL_RESULTS,
  };
}

async function runSourceScopedSearch(
  env: Env,
  options: AiSearchRequestOptions,
  retrievalType: AiSearchRetrievalType,
  project: PublicProjectRow,
  folderRoot: string,
): Promise<SearchOutcome> {
  const broadOptions = broadProjectOptions(options);
  const firstResult = await runSearch(env, broadOptions, retrievalType, null, folderRoot);
  const firstOutcome = createOutcome(firstResult, options, folderRoot);
  if (firstOutcome.formatted.results.length > 0) return firstOutcome;

  const hintedResult = await runSearch(
    env,
    broadOptions,
    retrievalType,
    null,
    folderRoot,
    buildProjectHintedQuery(options.query, project),
  );
  return createOutcome(hintedResult, options, folderRoot);
}

async function runScopedSearch(
  env: Env,
  options: AiSearchRequestOptions,
  retrievalType: AiSearchRetrievalType,
  project: PublicProjectRow | null,
  folderRoot: string,
  scopeMode: AiSearchProjectScopeMode,
): Promise<SearchOutcome> {
  if (!project) {
    return createOutcome(
      await runSearch(env, options, retrievalType, null, folderRoot),
      options,
      folderRoot,
    );
  }

  if (scopeMode === 'source') {
    return runSourceScopedSearch(env, options, retrievalType, project, folderRoot);
  }

  try {
    const metadataOutcome = createOutcome(
      await runSearch(env, options, retrievalType, project, folderRoot),
      options,
      folderRoot,
    );
    if (scopeMode === 'metadata' || metadataOutcome.formatted.results.length > 0) {
      return metadataOutcome;
    }
    return runSourceScopedSearch(env, options, retrievalType, project, folderRoot);
  } catch (error) {
    if (scopeMode === 'metadata') throw error;
    console.warn('cloudflare_ai_search_metadata_scope_fallback', {
      project: project.slug,
      error,
    });
    return runSourceScopedSearch(env, options, retrievalType, project, folderRoot);
  }
}

function availableModes(capabilities: AiSearchCapabilities): string[] {
  return [
    ...(capabilities.vector ? ['vector'] : []),
    ...(capabilities.keyword ? ['keyword'] : []),
    ...(capabilities.vector && capabilities.keyword ? ['hybrid'] : []),
  ];
}

export async function searchAiDocuments(
  env: Env,
  options: AiSearchRequestOptions,
  requestUrl: string,
): Promise<CompactAiSearchResponse> {
  if (!env.PROMPT_AI_SEARCH) {
    throw new AiSearchServiceError(
      'ai_search_unavailable',
      'Cloudflare AI Search is not configured for this Worker.',
      503,
    );
  }

  const project = options.project ? await resolvePublicProject(env, options.project) : null;
  if (options.project && !project) {
    throw new AiSearchServiceError('project_not_found', 'Public project not found.', 404);
  }

  const canonicalOptions: AiSearchRequestOptions = {
    ...options,
    project: project?.slug,
  };
  const capabilities = await getAiSearchCapabilities(env);
  const retrievalType = resolveRetrievalType(canonicalOptions, capabilities);
  if (!retrievalType) {
    throw new AiSearchServiceError(
      'retrieval_mode_unavailable',
      `The requested ${canonicalOptions.requestedRetrievalType} retrieval mode is not enabled for this AI Search instance.`,
      400,
      { availableModes: availableModes(capabilities) },
    );
  }

  const folderRoot = resolveAiSearchFolderRoot(env.AI_SEARCH_FOLDER_ROOT, requestUrl);
  const projectScopeMode = parseAiSearchProjectScopeMode(env.AI_SEARCH_PROJECT_SCOPE_MODE);
  let effectiveRetrievalType = retrievalType;

  try {
    let outcome: SearchOutcome;
    try {
      outcome = await runScopedSearch(
        env,
        canonicalOptions,
        effectiveRetrievalType,
        project,
        folderRoot,
        projectScopeMode,
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
      effectiveRetrievalType = 'vector';
      outcome = await runScopedSearch(
        env,
        canonicalOptions,
        effectiveRetrievalType,
        project,
        folderRoot,
        projectScopeMode,
      );
    }

    return compactAiSearchPayload({
      engine: 'cloudflare-ai-search',
      searchQuery: outcome.searchResult.search_query,
      query: {
        text: canonicalOptions.query,
        project: project ? { slug: project.slug, name: project.name } : null,
      },
      results: outcome.formatted.results,
    }) as CompactAiSearchResponse;
  } catch (error) {
    if (error instanceof AiSearchServiceError) throw error;
    console.error('cloudflare_ai_search_failed', {
      project: project?.slug ?? null,
      requestedMode: canonicalOptions.requestedRetrievalType,
      resolvedMode: effectiveRetrievalType,
      projectScopeMode,
      error,
    });
    throw new AiSearchServiceError(
      'ai_search_failed',
      'Cloudflare AI Search request failed.',
      502,
    );
  }
}

export async function searchAiDocumentsFromInput(
  env: Env,
  input: AiSearchInput,
): Promise<CompactAiSearchResponse> {
  const options = createAiSearchRequestOptions(input);
  return searchAiDocuments(env, options, resolveMcpRequestUrl(env));
}
