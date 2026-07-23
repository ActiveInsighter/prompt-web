const HTML_SIGNIFICANT_CHARACTERS = /[<>&\u2028\u2029]/g;

const JSON_ESCAPE_BY_CHARACTER: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

type CompactAiSearchMode = 'auto' | 'hybrid' | 'keyword' | 'vector';

export interface CompactAiSearchResult {
  score: number;
  title: string;
  text: string;
  project: string | null;
  path: string | null;
  uri: string | null;
  url: string | null;
}

export interface CompactAiSearchResponse extends Record<string, unknown> {
  query: string;
  project: string | null;
  count: number;
  results: CompactAiSearchResult[];
  meta: {
    mode: CompactAiSearchMode;
    group: 'files' | 'chunks';
    duration_ms: number;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function resolveRawUrl(source: Record<string, unknown>): string | null {
  const rawPath = optionalString(source.rawPath);
  const sourceUrl = optionalString(source.url) ?? optionalString(source.key);

  if (rawPath && sourceUrl) {
    try {
      return new URL(rawPath, sourceUrl).toString();
    } catch {
      return rawPath;
    }
  }
  return rawPath ?? sourceUrl;
}

function resolvePromptUri(project: string | null, path: string | null): string | null {
  if (!project || !path) return null;
  const encodedProject = encodeURIComponent(project);
  const encodedPath = path
    .replace(/^\/+/, '')
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return encodedPath ? `prompt://${encodedProject}/${encodedPath}` : null;
}

function titleFromPath(path: string | null): string | null {
  if (!path) return null;
  const fileName = path.split('/').filter(Boolean).at(-1);
  if (!fileName) return null;
  const stem = fileName.replace(/\.[^.]+$/u, '').replace(/[-_]+/gu, ' ').trim();
  if (!stem) return null;
  return stem.replace(/(^|\s)(\p{L})/gu, (_match, prefix: string, letter: string) =>
    `${prefix}${letter.toLocaleUpperCase()}`,
  );
}

function resolveResultTitle(
  result: Record<string, unknown>,
  source: Record<string, unknown>,
  path: string | null,
): string {
  const metadata = isRecord(source.metadata) ? source.metadata : {};
  return (
    optionalString(result.title) ??
    optionalString(source.title) ??
    optionalString(metadata.title) ??
    optionalString(metadata.display_title) ??
    optionalString(metadata.name) ??
    titleFromPath(path) ??
    'Untitled'
  );
}

function compactMeta(value: Record<string, unknown>): CompactAiSearchResponse['meta'] {
  const meta = isRecord(value.meta) ? value.meta : {};
  const mode: CompactAiSearchMode =
    meta.mode === 'auto' || meta.mode === 'hybrid' || meta.mode === 'keyword'
      ? meta.mode
      : 'vector';
  const group = meta.group === 'chunks' ? 'chunks' : 'files';
  const duration =
    typeof meta.duration_ms === 'number' && Number.isFinite(meta.duration_ms)
      ? Math.max(0, Math.round(meta.duration_ms))
      : 0;
  return { mode, group, duration_ms: duration };
}

export function compactAiSearchPayload(value: unknown): unknown {
  if (!isRecord(value) || value.engine !== 'cloudflare-ai-search' || !Array.isArray(value.results)) {
    return value;
  }

  const query = isRecord(value.query) ? value.query : {};
  const queryProject = query.project;
  const project = isRecord(queryProject)
    ? optionalString(queryProject.slug)
    : optionalString(queryProject);

  const results = value.results.flatMap((result): CompactAiSearchResult[] => {
    if (!isRecord(result)) return [];
    const source = isRecord(result.source) ? result.source : {};
    const resultProject = optionalString(source.project);
    const path = optionalString(source.path);
    return [
      {
        score: typeof result.score === 'number' ? result.score : 0,
        title: resolveResultTitle(result, source, path),
        text: optionalString(result.text) ?? '',
        project: resultProject,
        path,
        uri: resolvePromptUri(resultProject, path),
        url: resolveRawUrl(source),
      },
    ];
  });

  return {
    query: optionalString(query.text) ?? optionalString(value.searchQuery) ?? '',
    project,
    count: results.length,
    results,
    meta: compactMeta(value),
  } satisfies CompactAiSearchResponse;
}

/**
 * Serializes JSON while escaping HTML-significant characters for safe embedding
 * and transport. Search text is otherwise preserved exactly as returned by the
 * Items API index; there is no crawler-specific de-escaping layer.
 */
export function serializeAiSafeJson(value: unknown): string {
  const serialized = JSON.stringify(compactAiSearchPayload(value));
  if (serialized === undefined) {
    throw new TypeError('Value is not JSON serializable.');
  }
  return serialized.replace(
    HTML_SIGNIFICANT_CHARACTERS,
    (character) => JSON_ESCAPE_BY_CHARACTER[character] ?? character,
  );
}
