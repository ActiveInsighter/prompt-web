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

export function buildRawFilePath(projectSlug: string, path: string): string {
  const project = encodeURIComponent(projectSlug.normalize('NFKC').trim());
  const encodedPath = encodePath(path);
  return `/raw/${project}/${encodedPath}`;
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
    addEntry(buildRawFilePath(projectSlug, file.path), file.updatedAt, 0.7);
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
    'Allow: /raw/',
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
