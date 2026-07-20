const HTML_SIGNIFICANT_CHARACTERS = /[<>&\u2028\u2029]/g;

const JSON_ESCAPE_BY_CHARACTER: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

/**
 * Serializes JSON without leaving literal HTML-significant characters in the
 * response body. Standard JSON parsers reconstruct the original content, while
 * generic HTML/text extractors cannot mistake JSX or MDX fragments for tags.
 */
export function serializeAiSafeJson(value: unknown): string {
  return JSON.stringify(value).replace(
    HTML_SIGNIFICANT_CHARACTERS,
    (character) => JSON_ESCAPE_BY_CHARACTER[character] ?? character,
  );
}
