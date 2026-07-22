import {
  compactAiSearchPayload,
  type CompactAiSearchResponse,
} from '../http/ai-safe-json';
import {
  parseAiSearchRequest,
  type AiSearchChunkLike,
  type AiSearchGrouping,
  type AiSearchRequestOptions,
  type AiSearchRequestedRetrievalType,
  type AiSearchResult,
  type AiSearchRetrievalType,
} from '../http/cloudflare-ai-search-utils';
import type { AccessContext, Env, PromptVisibility } from '../types';

interface VisibleProjectRow {
  id: string;
  slug: string;
  name: string;
  instance_id: string;
}

interface SearchDocumentRow {
  file_id: string;
  project_id: string;
  project_slug: string;
  path: string;
  title: string;
  visibility: PromptVisibility;
}

interface SearchResponseLike {
  search_query?: string;
  chunks: AiSearchChunkLike[];
  errors?: Array<{ instance_id?: string; message?: string }>;
}

interface UpstreamErrorDetails extends Record<string, unknown> {
  upstreamStatus?: number;
  upstreamCode?: string;
  upstreamMessage?: string;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function upstreamDetails(error: unknown): UpstreamErrorDetails {
  if (!isRecord(error)) {
    return error instanceof Error ? { upstreamMessage: error.message } : {};
  }
  const statusCandidates = [error.status, error.statusCode, error.httpStatus, error.responseStatus];
  const upstreamStatus = statusCandidates.find(
    (value): value is number => typeof value === 'number' && Number.isFinite(value),
  );
  return {
    ...(upstreamStatus !== undefined ? { upstreamStatus } : {}),
    ...(optionalString(error.code) ? { upstreamCode: optionalString(error.code) } : {}),
    ...(optionalString(error.message) ? { upstreamMessage: optionalString(error.message) } : {}),
  };
}

function placeholders(length: number): string {
  return Array.from({ length }, () => '?').join(', ');
}

function resolveRetrievalType(requested: AiSearchRequestedRetrievalType): AiSearchRetrievalType {
  return requested === 'auto' ? 'vector' : requested;
}

function buildSearchRequest(
  options: AiSearchRequestOptions,
  retrievalType: AiSearchRetrievalType,
  access: AccessContext,
) {
  return {
    query: options.query,
    ai_search_options: {
      retrieval: {
        retrieval_type: retrievalType,
        max_num_results: options.retrievalLimit,
        match_threshold: options.matchThreshold,
        return_on_failure: true,
        ...(options.contextExpansion > 0
          ? { context_expansion: options.contextExpansion }
          : {}),
        ...(!access.authenticated ? { filters: { visibility: 'public' } } : {}),
      },
      ...(options.reranking ? { reranking: { enabled: true } } : {}),
    },
  };
}

async function resolveVisibleProjects(
  env: Env,
  access: AccessContext,
  identifier?: string,
): Promise<VisibleProjectRow[]> {
  const visibilityPlaceholders = placeholders(access.allowedVisibilities.length);
  const params: unknown[] = [...access.allowedVisibilities];
  const identifierClause = identifier
    ? 'AND (lower(p.slug) = lower(?) OR lower(p.id) = lower(?))'
    : '';
  if (identifier) params.push(identifier, identifier);

  const result = await env.DB.prepare(
    `SELECT p.id, p.slug, p.name, mapping.instance_id
     FROM projects p
     JOIN ai_search_projects mapping ON mapping.project_id = p.id
     WHERE p.deleted_at IS NULL
       AND p.visibility IN (${visibilityPlaceholders})
       AND mapping.status = 'ready'
       ${identifierClause}
     ORDER BY p.slug COLLATE NOCASE ASC`,
  )
    .bind(...params)
    .all<VisibleProjectRow>();
  return result.results;
}

function splitIntoGroups<T>(values: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    groups.push(values.slice(index, index + size));
  }
  return groups;
}

async function runSearches(
  env: Env,
  projects: VisibleProjectRow[],
  options: AiSearchRequestOptions,
  retrievalType: AiSearchRetrievalType,
  access: AccessContext,
): Promise<{ searchQuery: string; chunks: AiSearchChunkLike[]; partialErrors: unknown[] }> {
  const request = buildSearchRequest(options, retrievalType, access);
  if (projects.length === 1) {
    const response = (await env.PROMPT_AI_SEARCH
      .get(projects[0].instance_id)
      .search(request)) as SearchResponseLike;
    return {
      searchQuery: response.search_query ?? options.query,
      chunks: response.chunks ?? [],
      partialErrors: response.errors ?? [],
    };
  }

  const groups = splitIntoGroups(projects.map((project) => project.instance_id), 10);
  const settled = await Promise.allSettled(
    groups.map(async (instanceIds) =>
      (await env.PROMPT_AI_SEARCH.search({
        ...request,
        ai_search_options: {
          ...request.ai_search_options,
          instance_ids: instanceIds,
        },
      })) as SearchResponseLike,
    ),
  );
  const successful = settled.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : [],
  );
  const failed = settled.flatMap((result) =>
    result.status === 'rejected' ? [result.reason] : [],
  );
  if (successful.length === 0 && failed.length > 0) throw failed[0];
  return {
    searchQuery: successful[0]?.search_query ?? options.query,
    chunks: successful.flatMap((response) => response.chunks ?? []),
    partialErrors: [
      ...failed,
      ...successful.flatMap((response) => response.errors ?? []),
    ],
  };
}

function metadataFileId(chunk: AiSearchChunkLike): string | null {
  const value = chunk.item.metadata?.file_id;
  return typeof value === 'string' && value.trim() ? value : null;
}

function encodePath(path: string): string {
  return path
    .replace(/^\/+/, '')
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

async function hydrateResults(
  env: Env,
  chunks: AiSearchChunkLike[],
  projects: VisibleProjectRow[],
  options: AiSearchRequestOptions,
  access: AccessContext,
  requestUrl: string,
): Promise<AiSearchResult[]> {
  const fileIds = [
    ...new Set(chunks.map(metadataFileId).filter((value): value is string => value !== null)),
  ];
  if (fileIds.length === 0) return [];

  const projectIds = projects.map((project) => project.id);
  const rows = await env.DB.prepare(
    `SELECT file_id, project_id, project_slug, path, title, visibility
     FROM prompt_search_documents
     WHERE file_id IN (${placeholders(fileIds.length)})
       AND project_id IN (${placeholders(projectIds.length)})
       AND visibility IN (${placeholders(access.allowedVisibilities.length)})`,
  )
    .bind(...fileIds, ...projectIds, ...access.allowedVisibilities)
    .all<SearchDocumentRow>();
  const documents = new Map(rows.results.map((row) => [row.file_id, row]));
  const origin = new URL(requestUrl).origin;

  const mapped = chunks.flatMap((chunk): AiSearchResult[] => {
    const fileId = metadataFileId(chunk);
    const document = fileId ? documents.get(fileId) : undefined;
    if (!document) return [];
    const encodedProject = encodeURIComponent(document.project_slug);
    const encodedDocumentPath = encodePath(document.path);
    const rawPath = `/raw/${encodedProject}/${encodedDocumentPath}`;
    const apiPath = `/api/files/${encodedProject}/${encodedDocumentPath}`;
    const viewerPath = `/p/${encodedProject}/${encodedDocumentPath}`;
    return [
      {
        id: chunk.id,
        type: chunk.type ?? 'text',
        score: Number.isFinite(chunk.score) ? chunk.score : 0,
        text: chunk.text,
        source: {
          key: chunk.item.key,
          url: new URL(rawPath, origin).toString(),
          project: document.project_slug,
          path: document.path,
          apiPath,
          viewerPath,
          rawPath,
          title: document.title,
          timestamp: chunk.item.timestamp ?? null,
          metadata: chunk.item.metadata ?? {},
        },
        scoringDetails: chunk.scoring_details ?? null,
      },
    ];
  });

  mapped.sort((left, right) => right.score - left.score);
  if (options.grouping === 'chunks') return mapped.slice(0, options.limit);

  const seen = new Set<string>();
  const deduplicated: AiSearchResult[] = [];
  for (const result of mapped) {
    const fileId = optionalString(result.source.metadata.file_id) ?? result.source.key;
    if (seen.has(fileId)) continue;
    seen.add(fileId);
    deduplicated.push(result);
    if (deduplicated.length >= options.limit) break;
  }
  return deduplicated;
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

export async function searchAiDocuments(
  env: Env,
  access: AccessContext,
  options: AiSearchRequestOptions,
  requestUrl: string,
): Promise<CompactAiSearchResponse> {
  const startedAt = Date.now();
  const projects = await resolveVisibleProjects(env, access, options.project);
  if (options.project && projects.length === 0) {
    const visibleWithoutReadyMapping = await env.DB.prepare(
      `SELECT 1 AS found
       FROM projects
       WHERE deleted_at IS NULL
         AND visibility IN (${placeholders(access.allowedVisibilities.length)})
         AND (lower(slug) = lower(?) OR lower(id) = lower(?))
       LIMIT 1`,
    )
      .bind(...access.allowedVisibilities, options.project, options.project)
      .first<{ found: number }>();
    if (!visibleWithoutReadyMapping) {
      throw new AiSearchServiceError('project_not_found', 'Project not found or not accessible.', 404);
    }
    throw new AiSearchServiceError(
      'ai_search_index_not_ready',
      'The project AI Search index is still being prepared.',
      503,
      { project: options.project },
    );
  }
  if (projects.length === 0) {
    throw new AiSearchServiceError(
      'ai_search_index_not_ready',
      'No accessible AI Search project indexes are ready.',
      503,
    );
  }

  const retrievalType = resolveRetrievalType(options.requestedRetrievalType);
  try {
    const outcome = await runSearches(env, projects, options, retrievalType, access);
    const results = await hydrateResults(
      env,
      outcome.chunks,
      projects,
      options,
      access,
      requestUrl,
    );
    if (outcome.partialErrors.length > 0) {
      console.warn('cloudflare_ai_search_partial_failure', {
        projects: projects.map((project) => project.slug),
        errors: outcome.partialErrors,
      });
    }

    return compactAiSearchPayload({
      engine: 'cloudflare-ai-search',
      searchQuery: outcome.searchQuery,
      query: {
        text: options.query,
        project: options.project
          ? { slug: projects[0].slug, name: projects[0].name }
          : null,
      },
      results,
      meta: {
        mode: retrievalType,
        group: options.grouping,
        duration_ms: Date.now() - startedAt,
      },
    }) as CompactAiSearchResponse;
  } catch (error) {
    if (error instanceof AiSearchServiceError) throw error;
    const upstream = upstreamDetails(error);
    const details: Record<string, unknown> = {
      projects: projects.map((project) => project.slug),
      requestedMode: options.requestedRetrievalType,
      resolvedMode: retrievalType,
      ...upstream,
    };
    const message = upstream.upstreamMessage ?? '';
    if (/retrieval|keyword|hybrid|index method/iu.test(message)) {
      throw new AiSearchServiceError(
        'retrieval_mode_unavailable',
        `The requested ${options.requestedRetrievalType} retrieval mode is unavailable.`,
        400,
        details,
      );
    }
    console.error('cloudflare_ai_search_failed', { ...details, error });
    throw new AiSearchServiceError(
      'ai_search_failed',
      'Cloudflare AI Search request failed.',
      502,
      details,
    );
  }
}

export async function searchAiDocumentsFromInput(
  env: Env,
  access: AccessContext,
  input: AiSearchInput,
): Promise<CompactAiSearchResponse> {
  const options = createAiSearchRequestOptions(input);
  return searchAiDocuments(env, access, options, 'https://prompt.local/api/ai-search');
}
