export const DEFAULT_AI_SEARCH_LIMIT = 10;
export const MAX_AI_SEARCH_LIMIT = 20;
export const DEFAULT_AI_SEARCH_THRESHOLD = 0.4;
export const DEFAULT_CONTEXT_EXPANSION = 0;
export const MAX_AI_SEARCH_QUERY_LENGTH = 1_000;

export type AiSearchRetrievalType = 'hybrid' | 'keyword' | 'vector';
export type AiSearchRequestedRetrievalType = AiSearchRetrievalType | 'auto';
export type AiSearchGrouping = 'files' | 'chunks';

export interface AiSearchRequestOptions {
  query: string;
  project?: string;
  requestedRetrievalType: AiSearchRequestedRetrievalType;
  grouping: AiSearchGrouping;
  limit: number;
  retrievalLimit: number;
  matchThreshold: number;
  contextExpansion: number;
  reranking: boolean;
}

export interface AiSearchChunkLike {
  id: string;
  type?: string;
  score: number;
  text: string;
  instance_id?: string;
  item: {
    key: string;
    timestamp?: number;
    metadata?: Record<string, unknown>;
  };
  scoring_details?: Record<string, unknown>;
}

export interface AiSearchSource {
  key: string;
  url: string | null;
  project: string | null;
  path: string | null;
  apiPath: string | null;
  viewerPath: string | null;
  rawPath: string | null;
  title?: string;
  timestamp: number | null;
  metadata: Record<string, unknown>;
}

export interface AiSearchResult {
  id: string;
  type: string;
  score: number;
  text: string;
  source: AiSearchSource;
  scoringDetails: Record<string, unknown> | null;
}

export class AiSearchRequestError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'AiSearchRequestError';
    this.code = code;
  }
}

function normalizeOptionalText(value: string | null | undefined): string | undefined {
  const normalized = value?.normalize('NFKC').trim();
  return normalized || undefined;
}

function parseInteger(
  value: string | null,
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (value === null || value.trim() === '') return fallback;
  if (!/^-?\d+$/u.test(value.trim())) {
    throw new AiSearchRequestError(`${name} must be an integer.`, `invalid_${name}`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new AiSearchRequestError(
      `${name} must be between ${minimum} and ${maximum}.`,
      `invalid_${name}`,
    );
  }
  return parsed;
}

function parseNumber(
  value: string | null,
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (value === null || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) {
    throw new AiSearchRequestError(
      `${name} must be between ${minimum} and ${maximum}.`,
      `invalid_${name}`,
    );
  }
  return parsed;
}

function parseBoolean(value: string | null, name: string, fallback: boolean): boolean {
  if (value === null || value.trim() === '') return fallback;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  throw new AiSearchRequestError(`${name} must be true or false.`, `invalid_${name}`);
}

function parseRetrievalType(value: string | null): AiSearchRequestedRetrievalType {
  const normalized = value?.trim().toLowerCase() || 'auto';
  if (
    normalized === 'auto' ||
    normalized === 'hybrid' ||
    normalized === 'keyword' ||
    normalized === 'vector'
  ) {
    return normalized;
  }
  throw new AiSearchRequestError(
    'mode must be one of auto, hybrid, keyword, or vector.',
    'invalid_mode',
  );
}

function parseGrouping(value: string | null): AiSearchGrouping {
  const normalized = value?.trim().toLowerCase() || 'files';
  if (normalized === 'files' || normalized === 'chunks') return normalized;
  throw new AiSearchRequestError('group must be either files or chunks.', 'invalid_group');
}

export function normalizeProjectIdentifier(value: string | undefined): string | undefined {
  const project = normalizeOptionalText(value);
  if (!project) return undefined;
  if (project.length > 128 || project.includes('/') || project.includes('\\')) {
    throw new AiSearchRequestError('Invalid project identifier.', 'invalid_project');
  }
  return project;
}

export function parseAiSearchRequest(
  requestUrl: string,
  routeProject?: string,
): AiSearchRequestOptions {
  const url = new URL(requestUrl);
  const query = normalizeOptionalText(url.searchParams.get('q') ?? url.searchParams.get('query'));
  if (!query) {
    throw new AiSearchRequestError('Missing q query parameter.', 'missing_query');
  }
  if (query.length > MAX_AI_SEARCH_QUERY_LENGTH) {
    throw new AiSearchRequestError(
      `q must not exceed ${MAX_AI_SEARCH_QUERY_LENGTH} characters.`,
      'query_too_long',
    );
  }

  const routeProjectValue = normalizeProjectIdentifier(routeProject);
  const queryProjectValue = normalizeProjectIdentifier(
    normalizeOptionalText(url.searchParams.get('project')),
  );
  if (
    routeProjectValue &&
    queryProjectValue &&
    routeProjectValue.toLowerCase() !== queryProjectValue.toLowerCase()
  ) {
    throw new AiSearchRequestError(
      'The route project and project query parameter must match.',
      'project_conflict',
    );
  }

  const grouping = parseGrouping(url.searchParams.get('group'));
  const limit = parseInteger(
    url.searchParams.get('limit'),
    'limit',
    DEFAULT_AI_SEARCH_LIMIT,
    1,
    MAX_AI_SEARCH_LIMIT,
  );

  return {
    query,
    project: routeProjectValue ?? queryProjectValue,
    requestedRetrievalType: parseRetrievalType(url.searchParams.get('mode')),
    grouping,
    limit,
    retrievalLimit: grouping === 'files' ? Math.min(50, limit * 3) : limit,
    matchThreshold: parseNumber(
      url.searchParams.get('threshold'),
      'threshold',
      DEFAULT_AI_SEARCH_THRESHOLD,
      0,
      1,
    ),
    contextExpansion: parseInteger(
      url.searchParams.get('context'),
      'context',
      DEFAULT_CONTEXT_EXPANSION,
      0,
      3,
    ),
    reranking: parseBoolean(url.searchParams.get('rerank'), 'rerank', false),
  };
}
