const url = 'https://prompt.2212148739lbw.workers.dev/api/ai-search/tailwindcss-docs?q=padding&limit=5';

const response = await fetch(url, {
  headers: { accept: 'application/json' },
  signal: AbortSignal.timeout(60_000),
});

const raw = await response.text();
console.log('LIVE_AI_SEARCH_STATUS', response.status);
console.log('LIVE_AI_SEARCH_RAW_PREFIX', raw.slice(0, 3000));

if (!response.ok) {
  throw new Error(`Live AI Search request failed: ${response.status}`);
}

const data = JSON.parse(raw);
const text = data?.results?.[0]?.text;
console.log('LIVE_AI_SEARCH_PARSED_TEXT_PREFIX', JSON.stringify(text?.slice(0, 3000)));
console.log('LIVE_AI_SEARCH_HAS_ESCAPED_HEADING', typeof text === 'string' && text.includes('\\# padding'));
console.log('LIVE_AI_SEARCH_HAS_ESCAPED_BACKTICK', typeof text === 'string' && text.includes('\\`'));
console.log('LIVE_AI_SEARCH_HAS_ESCAPED_BRACKET', typeof text === 'string' && text.includes('\\['));
console.log('LIVE_AI_SEARCH_HAS_LITERAL_HEADING', typeof text === 'string' && text.includes('# padding'));
console.log('LIVE_AI_SEARCH_HAS_LITERAL_BACKTICK', typeof text === 'string' && text.includes('`'));
console.log('LIVE_AI_SEARCH_HAS_LITERAL_NUMBER_TAG', typeof text === 'string' && text.includes('<number>'));
