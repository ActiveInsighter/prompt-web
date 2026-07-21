const HTML_SIGNIFICANT_CHARACTERS = /[<>&\u2028\u2029]/g;
const AI_INDEX_ESCAPED_LESS_THAN = '\\u003c';
const AI_INDEX_ESCAPED_GREATER_THAN = '\\u003e';

const JSON_ESCAPE_BY_CHARACTER: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function isAiIndexSourceKey(value: unknown): boolean {
  if (typeof value !== 'string') return false;

  let pathname = value.normalize('NFKC').trim();
  try {
    pathname = new URL(pathname).pathname;
  } catch {
    pathname = pathname.split(/[?#]/u, 1)[0] ?? pathname;
  }

  const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return normalizedPathname.startsWith('/ai-index/');
}

function restoreAiIndexEscapes(value: string): string {
  return value
    .replaceAll(AI_INDEX_ESCAPED_LESS_THAN, '<')
    .replaceAll(AI_INDEX_ESCAPED_GREATER_THAN, '>');
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

function normalizeAiSearchPayload(value: unknown): unknown {
  if (!isRecord(value) || value.engine !== 'cloudflare-ai-search' || !Array.isArray(value.results)) {
    return value;
  }

  const query = isRecord(value.query) ? value.query : {};
  const queryProject = query.project;
  const project = isRecord(queryProject)
    ? optionalString(queryProject.slug)
    : optionalString(queryProject);

  const results = value.results.flatMap((result) => {
    if (!isRecord(result)) return [];

    const source = isRecord(result.source) ? result.source : {};
    const sourceKey = optionalString(source.key);
    const rawText = optionalString(result.text) ?? '';
    const text = sourceKey && isAiIndexSourceKey(sourceKey)
      ? restoreAiIndexEscapes(rawText)
      : rawText;

    return [
      {
        score: typeof result.score === 'number' ? result.score : 0,
        text,
        project: optionalString(source.project),
        path: optionalString(source.path),
        url: resolveRawUrl(source),
      },
    ];
  });

  return {
    query: optionalString(query.text) ?? optionalString(value.searchQuery) ?? '',
    project,
    count: results.length,
    results,
  };
}

/**
 * Serializes JSON without leaving literal HTML-significant characters in the
 * response body. AI Search responses are also reduced to the fields callers
 * need and crawl-safe tag escapes are restored before the final JSON encoding.
 */
export function serializeAiSafeJson(value: unknown): string {
  const serialized = JSON.stringify(normalizeAiSearchPayload(value));
  if (serialized === undefined) {
    throw new TypeError('Value is not JSON serializable.');
  }

  return serialized.replace(
    HTML_SIGNIFICANT_CHARACTERS,
    (character) => JSON_ESCAPE_BY_CHARACTER[character] ?? character,
  );
}
