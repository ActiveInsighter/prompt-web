export const MAX_SITEMAP_URLS = 50_000;

const AI_INDEX_ESCAPED_LESS_THAN = '\\u003c';
const AI_INDEX_ESCAPED_GREATER_THAN = '\\u003e';
const TAG_NAME_START_PATTERN = /[A-Za-z]/u;
const TAG_NAME_CHARACTER_PATTERN = /[A-Za-z0-9._:-]/u;
const IDENTIFIER_CHARACTER_PATTERN = /[\p{L}\p{N}_$]/u;
const TYPE_PARAMETER_LIST_PATTERN =
  /^[A-Z_$][A-Za-z0-9_$]*(?:\s+extends\s+[^,>]+)?(?:\s*=\s*[^,>]+)?(?:\s*,\s*[A-Z_$][A-Za-z0-9_$]*(?:\s+extends\s+[^,>]+)?(?:\s*=\s*[^,>]+)?)*$/u;

export interface AiSearchProjectEntry {
  slug: string;
  updatedAt: string;
}

export interface AiSearchFileEntry {
  projectSlug: string;
  path: string;
  updatedAt: string;
}

interface AiIndexTagBoundary {
  start: number;
  end: number;
}

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/gu, (character) => {
    switch (character) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '"':
        return '&quot;';
      case "'":
        return '&apos;';
      default:
        return character;
    }
  });
}

function encodePath(path: string): string {
  return path
    .replace(/^\/+|\/+$/gu, '')
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function normalizeOrigin(origin: string): string {
  const url = new URL(origin);
  url.pathname = '/';
  url.search = '';
  url.hash = '';
  return url.origin;
}

function normalizeLastmod(value: string): string | undefined {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined;
}

function isIdentifierCharacter(character: string | undefined): boolean {
  return Boolean(character && IDENTIFIER_CHARACTER_PATTERN.test(character));
}

function findDelimitedTagEnd(content: string, start: number): number | null {
  let quote: '"' | "'" | '`' | null = null;
  let escaped = false;
  let expressionDepth = 0;

  for (let index = start; index < content.length; index += 1) {
    const character = content[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'" || character === '`') {
      quote = character;
      continue;
    }
    if (character === '{') {
      expressionDepth += 1;
      continue;
    }
    if (character === '}' && expressionDepth > 0) {
      expressionDepth -= 1;
      continue;
    }
    if (character === '>' && expressionDepth === 0) {
      return index;
    }
  }

  return null;
}

function hasClosingTag(content: string, tagName: string, from: number): boolean {
  return content.indexOf(`</${tagName}`, from) !== -1;
}

function isLikelyTypeParameterList(
  content: string,
  start: number,
  end: number,
  tagName: string,
  closing: boolean,
  selfClosing: boolean,
): boolean {
  if (closing || selfClosing || hasClosingTag(content, tagName, end + 1)) return false;

  const candidate = content.slice(start + 1, end).trim();
  if (!TYPE_PARAMETER_LIST_PATTERN.test(candidate)) return false;

  const before = content[start - 1];
  const after = content[end + 1];
  return (
    isIdentifierCharacter(before) ||
    before === ')' ||
    before === ']' ||
    after === '(' ||
    after === '[' ||
    isIdentifierCharacter(after)
  );
}

function findAiIndexTagBoundary(content: string, start: number): AiIndexTagBoundary | null {
  if (content[start] !== '<') return null;

  if (content.startsWith('<!--', start)) {
    const commentEnd = content.indexOf('-->', start + 4);
    return commentEnd === -1 ? null : { start, end: commentEnd + 2 };
  }
  if (content.startsWith('<![CDATA[', start)) {
    const cdataEnd = content.indexOf(']]>', start + 9);
    return cdataEnd === -1 ? null : { start, end: cdataEnd + 2 };
  }
  if (content.startsWith('<>', start)) return { start, end: start + 1 };
  if (content.startsWith('</>', start)) return { start, end: start + 2 };

  let cursor = start + 1;
  const closing = content[cursor] === '/';
  if (closing) cursor += 1;

  if (content[cursor] === '!' || content[cursor] === '?') {
    const end = findDelimitedTagEnd(content, cursor + 1);
    return end === null ? null : { start, end };
  }
  if (!TAG_NAME_START_PATTERN.test(content[cursor] ?? '')) return null;

  if (!closing) {
    const before = content[start - 1];
    if (isIdentifierCharacter(before) || before === ')' || before === ']') return null;
  }

  const nameStart = cursor;
  cursor += 1;
  while (cursor < content.length && TAG_NAME_CHARACTER_PATTERN.test(content[cursor])) {
    cursor += 1;
  }

  const tagName = content.slice(nameStart, cursor);
  const boundaryCharacter = content[cursor];
  if (
    boundaryCharacter !== '>' &&
    boundaryCharacter !== '/' &&
    !/\s/u.test(boundaryCharacter ?? '')
  ) {
    return null;
  }
  if (tagName.endsWith(':') && content.startsWith('//', cursor)) return null;

  const end = findDelimitedTagEnd(content, cursor);
  if (end === null) return null;

  let previous = end - 1;
  while (previous > cursor && /\s/u.test(content[previous])) previous -= 1;
  const selfClosing = content[previous] === '/';

  if (isLikelyTypeParameterList(content, start, end, tagName, closing, selfClosing)) {
    return null;
  }
  return { start, end };
}

export function escapeAiIndexContent(content: string): string {
  const lessThanIndexes = new Set<number>();
  const greaterThanIndexes = new Set<number>();

  for (let index = 0; index < content.length; index += 1) {
    if (content[index] !== '<') continue;
    const boundary = findAiIndexTagBoundary(content, index);
    if (!boundary) continue;
    lessThanIndexes.add(boundary.start);
    greaterThanIndexes.add(boundary.end);
  }

  if (lessThanIndexes.size === 0) return content;

  let escaped = '';
  for (let index = 0; index < content.length; index += 1) {
    if (lessThanIndexes.has(index)) {
      escaped += AI_INDEX_ESCAPED_LESS_THAN;
    } else if (greaterThanIndexes.has(index)) {
      escaped += AI_INDEX_ESCAPED_GREATER_THAN;
    } else {
      escaped += content[index];
    }
  }
  return escaped;
}

export function buildRawFilePath(projectSlug: string, path: string): string {
  const project = encodeURIComponent(projectSlug.normalize('NFKC').trim());
  const encodedPath = encodePath(path);
  return `/raw/${project}/${encodedPath}`;
}

export function buildAiIndexFilePath(projectSlug: string, path: string): string {
  const project = encodeURIComponent(projectSlug.normalize('NFKC').trim());
  const encodedPath = encodePath(path);
  return `/ai-index/${project}/${encodedPath}`;
}

export function buildAiSearchSitemap(
  origin: string,
  projects: AiSearchProjectEntry[],
  files: AiSearchFileEntry[],
): string {
  const baseOrigin = normalizeOrigin(origin);
  const entries: string[] = [];
  const seen = new Set<string>();
  const publicProjects = new Set(
    projects.map((project) => project.slug.normalize('NFKC').trim().toLowerCase()),
  );

  const addEntry = (path: string, updatedAt: string | undefined, priority: number) => {
    if (entries.length >= MAX_SITEMAP_URLS) return;

    const location = new URL(path, baseOrigin).toString();
    if (seen.has(location)) return;
    seen.add(location);

    const lastmod = updatedAt ? normalizeLastmod(updatedAt) : undefined;
    entries.push(
      [
        '  <url>',
        `    <loc>${escapeXml(location)}</loc>`,
        ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
        `    <priority>${priority.toFixed(1)}</priority>`,
        '  </url>',
      ].join('\n'),
    );
  };

  for (const file of files) {
    const projectSlug = file.projectSlug.normalize('NFKC').trim();
    if (!publicProjects.has(projectSlug.toLowerCase())) continue;
    addEntry(buildAiIndexFilePath(projectSlug, file.path), file.updatedAt, 0.7);
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');
}

export function buildAiSearchRobotsTxt(origin: string): string {
  const sitemapUrl = new URL('/sitemap.xml', normalizeOrigin(origin)).toString();
  return [
    'User-agent: Cloudflare-AI-Search',
    'Allow: /ai-index/',
    'Disallow: /raw/',
    'Disallow: /api/',
    'Disallow: /p/',
    '',
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${sitemapUrl}`,
    '',
  ].join('\n');
}
