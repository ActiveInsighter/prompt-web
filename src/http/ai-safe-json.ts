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

function normalizeAiSearchPayload(value: unknown): unknown {
  if (!isRecord(value) || value.engine !== 'cloudflare-ai-search' || !Array.isArray(value.results)) {
    return value;
  }

  let changed = false;
  const results = value.results.map((result) => {
    if (!isRecord(result) || typeof result.text !== 'string') return result;

    const source = isRecord(result.source) ? result.source : null;
    if (!source || !isAiIndexSourceKey(source.key)) return result;

    const text = restoreAiIndexEscapes(result.text);
    if (text === result.text) return result;

    changed = true;
    return {
      ...result,
      text,
    };
  });

  return changed
    ? {
        ...value,
        results,
      }
    : value;
}

/**
 * Serializes JSON without leaving literal HTML-significant characters in the
 * response body. Standard JSON parsers reconstruct the original content, while
 * generic HTML/text extractors cannot mistake JSX or MDX fragments for tags.
 *
 * AI Search indexes the crawl-safe /ai-index representation, where tag brackets
 * are stored as literal \\u003c and \\u003e sequences. Before serializing search
 * results, restore those brackets so JSON adds exactly one transport-level
 * escape. Consumers that parse the JSON receive the original Markdown/JSX text.
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
