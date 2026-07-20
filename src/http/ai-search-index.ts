export const MAX_SITEMAP_URLS = 50_000;

export interface AiSearchProjectEntry {
  slug: string;
  updatedAt: string;
}

export interface AiSearchFileEntry {
  projectSlug: string;
  path: string;
  updatedAt: string;
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

export function buildApiFilesPath(projectSlug?: string, path?: string): string {
  if (!projectSlug) return '/api/files';

  const project = encodeURIComponent(projectSlug.normalize('NFKC').trim());
  const encodedPath = encodePath(path ?? '');
  return encodedPath ? `/api/files/${project}/${encodedPath}` : `/api/files/${project}`;
}

export function buildAiSearchSitemap(
  origin: string,
  projects: AiSearchProjectEntry[],
  files: AiSearchFileEntry[],
): string {
  const baseOrigin = normalizeOrigin(origin);
  const entries: string[] = [];
  const seen = new Set<string>();

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

  const timestamps = [...projects.map((project) => project.updatedAt), ...files.map((file) => file.updatedAt)]
    .map((value) => Date.parse(value))
    .filter(Number.isFinite);
  const latestUpdatedAt = timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : undefined;

  addEntry(buildApiFilesPath(), latestUpdatedAt, 1);
  for (const project of projects) {
    addEntry(buildApiFilesPath(project.slug), project.updatedAt, 0.8);
  }
  for (const file of files) {
    addEntry(buildApiFilesPath(file.projectSlug, file.path), file.updatedAt, 0.7);
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
    'Allow: /api/files',
    'Disallow: /api/files/search',
    'Disallow: /api/files/fetch',
    '',
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${sitemapUrl}`,
    '',
  ].join('\n');
}
