import type { DirectoryListing, ProjectRecord } from '../types';

export const AI_INDEX_ROOT = '/ai-index';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/gu, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
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

function buildAiIndexPath(projectSlug?: string, path?: string): string {
  if (!projectSlug) return AI_INDEX_ROOT;

  const project = encodeURIComponent(projectSlug.normalize('NFKC').trim());
  const encodedPath = encodePath(path ?? '');
  return encodedPath
    ? `${AI_INDEX_ROOT}/${project}/${encodedPath}`
    : `${AI_INDEX_ROOT}/${project}`;
}

function absoluteUrl(origin: string, path: string): string {
  return new URL(path, origin).toString();
}

function htmlPage(title: string, canonicalUrl: string, content: string): string {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    '  <meta name="robots" content="index,follow">',
    `  <title>${escapeHtml(title)}</title>`,
    `  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">`,
    '</head>',
    '<body>',
    '  <main>',
    content,
    '  </main>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

export function buildAiIndexRootHtml(origin: string, projects: ProjectRecord[]): string {
  const canonicalUrl = absoluteUrl(origin, AI_INDEX_ROOT);
  const projectItems = projects
    .map((project) => {
      const projectUrl = absoluteUrl(origin, buildAiIndexPath(project.slug));
      const description = project.description
        ? `\n        <p>${escapeHtml(project.description)}</p>`
        : '';
      return [
        '      <li>',
        `        <a href="${escapeHtml(projectUrl)}">${escapeHtml(project.name)}</a>`,
        `        <code>${escapeHtml(project.slug)}</code>${description}`,
        '      </li>',
      ].join('\n');
    })
    .join('\n');

  const sitemapUrl = absoluteUrl(origin, '/sitemap.xml');
  return htmlPage(
    'Prompt AI index',
    canonicalUrl,
    [
      '    <h1>Prompt AI index</h1>',
      '    <p>This crawl-only directory links to every indexable public project and document.</p>',
      `    <p><a href="${escapeHtml(sitemapUrl)}">XML sitemap</a></p>`,
      '    <ul>',
      projectItems || '      <li>No indexable projects are currently available.</li>',
      '    </ul>',
    ].join('\n'),
  );
}

function parentDirectoryPath(path: string): string {
  const segments = path.replace(/^\/+|\/+$/gu, '').split('/').filter(Boolean);
  segments.pop();
  return segments.length > 0 ? `/${segments.join('/')}` : '/';
}

export function buildAiIndexDirectoryHtml(origin: string, listing: DirectoryListing): string {
  const { project, path, entries } = listing;
  const canonicalPath = buildAiIndexPath(project.slug, path === '/' ? undefined : path);
  const canonicalUrl = absoluteUrl(origin, canonicalPath);
  const rootUrl = absoluteUrl(origin, AI_INDEX_ROOT);
  const projectUrl = absoluteUrl(origin, buildAiIndexPath(project.slug));

  const navigation = [
    `    <p><a href="${escapeHtml(rootUrl)}">All projects</a></p>`,
    path === '/'
      ? ''
      : `    <p><a href="${escapeHtml(
          absoluteUrl(origin, buildAiIndexPath(project.slug, parentDirectoryPath(path))),
        )}">Parent directory</a></p>`,
  ]
    .filter(Boolean)
    .join('\n');

  const entryItems = entries
    .map((entry) => {
      const entryUrl = absoluteUrl(origin, buildAiIndexPath(project.slug, entry.path));
      const label = entry.title || entry.name;
      const kind = entry.type === 'folder' ? 'Directory' : 'Document';
      const description = entry.description
        ? `\n        <p>${escapeHtml(entry.description)}</p>`
        : '';
      return [
        '      <li>',
        `        <span>${kind}:</span> <a href="${escapeHtml(entryUrl)}">${escapeHtml(label)}</a>`,
        `        <code>${escapeHtml(entry.path)}</code>${description}`,
        '      </li>',
      ].join('\n');
    })
    .join('\n');

  return htmlPage(
    `${project.name} AI index${path === '/' ? '' : ` — ${path}`}`,
    canonicalUrl,
    [
      `    <h1><a href="${escapeHtml(projectUrl)}">${escapeHtml(project.name)}</a></h1>`,
      `    <p>Project slug: <code>${escapeHtml(project.slug)}</code></p>`,
      `    <p>Directory: <code>${escapeHtml(path)}</code></p>`,
      navigation,
      '    <ul>',
      entryItems || '      <li>This directory is empty.</li>',
      '    </ul>',
    ]
      .filter(Boolean)
      .join('\n'),
  );
}
