export const DEFAULT_AI_SEARCH_LIMIT = 10;
export const MAX_AI_SEARCH_LIMIT = 20;
export const DEFAULT_AI_SEARCH_THRESHOLD = 0.4;
export const DEFAULT_CONTEXT_EXPANSION = 0;
export const DEFAULT_FOLDER_ROOT = '/ai-index';
export const MAX_AI_SEARCH_QUERY_LENGTH = 1_000;

export type AiSearchRetrievalType = 'hybrid' | 'keyword' | 'vector';
export type AiSearchRequestedRetrievalType = AiSearchRetrievalType | 'auto';
export type AiSearchGrouping = 'files' | 'chunks';
export type AiSearchProjectScopeMode = 'source' | 'metadata' | 'auto';

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

export function parseAiSearchProjectScopeMode(
  value: string | undefined,
): AiSearchProjectScopeMode {
  const normalized = value?.normalize('NFKC').trim().toLowerCase();
  if (normalized === 'metadata' || normalized === 'auto') return normalized;
  return 'source';
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

function normalizePathRoot(value: string): string {
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  const collapsed = withLeadingSlash.replace(/\/{2,}/gu, '/').replace(/\/+$/gu, '');
  return collapsed || DEFAULT_FOLDER_ROOT;
}

export function normalizeAiSearchFolderRoot(value?: string): string {
  const normalized = normalizeOptionalText(value) ?? DEFAULT_FOLDER_ROOT;
  try {
    const url = new URL(normalized);
    const pathname = normalizePathRoot(url.pathname);
    return `${url.origin}${pathname}`;
  } catch {
    return normalizePathRoot(normalized);
  }
}

export function resolveAiSearchFolderRoot(configuredRoot: string | undefined, requestUrl: string): string {
  if (normalizeOptionalText(configuredRoot)) {
    return normalizeAiSearchFolderRoot(configuredRoot);
  }
  return normalizeAiSearchFolderRoot(new URL(DEFAULT_FOLDER_ROOT, requestUrl).toString());
}

export function buildProjectFolderPrefix(project: string, folderRoot?: string): string {
  const canonicalProject = normalizeProjectIdentifier(project);
  if (!canonicalProject) {
    throw new AiSearchRequestError('Missing project identifier.', 'missing_project');
  }
  return `${normalizeAiSearchFolderRoot(folderRoot)}/${encodeURIComponent(canonicalProject)}/`;
}

export function buildProjectFolderFilter(
  project: string,
  folderRoot?: string,
): { folder: { $gte: string; $lt: string } } {
  const prefix = buildProjectFolderPrefix(project, folderRoot);
  return {
    folder: {
      $gte: prefix,
      $lt: `${prefix.slice(0, -1)}0`,
    },
  };
}

function decodePathSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function parseIndexedSourceKey(key: string): {
  url: string | null;
  project: string | null;
  path: string | null;
  apiPath: string | null;
  viewerPath: string | null;
  rawPath: string | null;
} {
  const normalizedKey = key.normalize('NFKC').trim();
  let pathname = normalizedKey;
  let url: string | null = null;

  try {
    const parsed = new URL(normalizedKey);
    pathname = parsed.pathname;
    url = parsed.toString();
  } catch {
    pathname = normalizedKey.split(/[?#]/u, 1)[0] ?? normalizedKey;
  }

  const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const match = normalizedPathname.match(/^\/(?:ai-index|raw|api\/files)\/([^/]+)\/(.+)$/u);
  if (!match) {
    return {
      url,
      project: null,
      path: null,
      apiPath: null,
      viewerPath: null,
      rawPath: null,
    };
  }

  const project = decodePathSegment(match[1]);
  const path = match[2]
    .split('/')
    .map(decodePathSegment)
    .join('/');
  const encodedProject = encodeURIComponent(project);
  const encodedPath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return {
    url,
    project,
    path: `/${path}`,
    apiPath: `/api/files/${encodedProject}/${encodedPath}`,
    viewerPath: `/p/${encodedProject}/${encodedPath}`,
    rawPath: `/raw/${encodedProject}/${encodedPath}`,
  };
}

function metadataFolder(chunk: AiSearchChunkLike): string | undefined {
  const folder = chunk.item.metadata?.folder;
  return typeof folder === 'string' ? folder : undefined;
}

export function chunkMatchesProject(
  chunk: AiSearchChunkLike,
  project: string,
  folderRoot?: string,
): boolean {
  const expectedProject = project.normalize('NFKC').toLowerCase();
  const source = parseIndexedSourceKey(chunk.item.key);
  if (source.project?.normalize('NFKC').toLowerCase() === expectedProject) return true;

  const folder = metadataFolder(chunk);
  if (!folder) return false;
  return folder.startsWith(buildProjectFolderPrefix(project, folderRoot));
}

function mapChunk(chunk: AiSearchChunkLike): AiSearchResult {
  const parsed = parseIndexedSourceKey(chunk.item.key);
  return {
    id: chunk.id,
    type: chunk.type ?? 'text',
    score: chunk.score,
    text: chunk.text,
    source: {
      key: chunk.item.key,
      ...parsed,
      timestamp: chunk.item.timestamp ?? null,
      metadata: chunk.item.metadata ?? {},
    },
    scoringDetails: chunk.scoring_details ?? null,
  };
}

export function formatAiSearchResults(
  chunks: AiSearchChunkLike[],
  options: Pick<AiSearchRequestOptions, 'grouping' | 'limit' | 'project'>,
  folderRoot?: string,
): { results: AiSearchResult[]; excludedChunks: number; duplicateChunks: number } {
  const fileChunks = chunks.filter((chunk) => parseIndexedSourceKey(chunk.item.key).path !== null);
  const project = options.project;
  const projectFiltered = project
    ? fileChunks.filter((chunk) => chunkMatchesProject(chunk, project, folderRoot))
    : fileChunks;
  const excludedChunks = chunks.length - projectFiltered.length;

  if (options.grouping === 'chunks') {
    return {
      results: projectFiltered.slice(0, options.limit).map(mapChunk),
      excludedChunks,
      duplicateChunks: 0,
    };
  }

  const seen = new Set<string>();
  const results: AiSearchResult[] = [];
  let duplicateChunks = 0;
  for (const chunk of projectFiltered) {
    const sourceKey = chunk.item.key.normalize('NFKC').trim().toLowerCase();
    if (seen.has(sourceKey)) {
      duplicateChunks += 1;
      continue;
    }
    seen.add(sourceKey);
    results.push(mapChunk(chunk));
    if (results.length >= options.limit) break;
  }

  return { results, excludedChunks, duplicateChunks };
}
