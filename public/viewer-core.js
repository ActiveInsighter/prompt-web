const VIEWER_PREFIX = '/p/';
const RAW_PREFIX = '/raw/';

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function encodePath(path) {
  return path
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function parsePromptIdentifier(identifier) {
  const normalized = identifier.normalize('NFKC').trim();
  const promptUri = normalized.match(/^prompt:\/\/([^/]+)\/(.+)$/iu);
  if (promptUri) {
    return {
      project: safeDecode(promptUri[1]),
      path: `/${promptUri[2].replace(/^\/+/, '')}`,
    };
  }

  const projectPath = normalized.match(/^([^:/?#]+):(\/.*)$/u);
  if (projectPath) {
    return {
      project: projectPath[1].trim(),
      path: `/${projectPath[2].replace(/^\/+/, '')}`,
    };
  }

  return null;
}

function parseProjectPathname(pathname, prefix) {
  if (!pathname.startsWith(prefix)) return null;

  const remainder = pathname.slice(prefix.length);
  const segments = remainder.split('/').filter(Boolean).map(safeDecode);
  if (segments.length < 2) return null;

  return {
    project: segments[0],
    path: `/${segments.slice(1).join('/')}`,
  };
}

export function buildPromptUri(project, path) {
  const normalizedProject = project.normalize('NFKC').trim();
  const normalizedPath = path.normalize('NFKC').trim().replace(/^\/+/, '');
  if (!normalizedProject || !normalizedPath) {
    throw new TypeError('Project and Markdown path are required.');
  }
  return `prompt://${normalizedProject}/${normalizedPath}`;
}

export function buildViewerPath(identifier) {
  const parsed = parsePromptIdentifier(identifier);
  if (!parsed) return `/p?identifier=${encodeURIComponent(identifier.trim())}`;

  return `${VIEWER_PREFIX}${encodeURIComponent(parsed.project)}/${encodePath(parsed.path)}`;
}

export function buildRawPath(identifier) {
  const parsed = parsePromptIdentifier(identifier);
  if (!parsed) return `/raw?identifier=${encodeURIComponent(identifier.trim())}`;

  return `${RAW_PREFIX}${encodeURIComponent(parsed.project)}/${encodePath(parsed.path)}`;
}

export function identifierFromViewerUrl(value, baseOrigin = 'https://prompt.invalid') {
  const url = value instanceof URL ? value : new URL(value, baseOrigin);
  const queryIdentifier = url.searchParams.get('identifier')?.trim();
  if (queryIdentifier) return queryIdentifier;

  const parsed = parseProjectPathname(url.pathname, VIEWER_PREFIX);
  return parsed ? buildPromptUri(parsed.project, parsed.path) : null;
}

export function normalizeViewerInput(value, baseOrigin = 'https://prompt.invalid') {
  const normalized = value.normalize('NFKC').trim();
  if (!normalized) throw new TypeError('Please enter a Markdown identifier or URL.');

  const directIdentifier = parsePromptIdentifier(normalized);
  if (directIdentifier) {
    return buildViewerPath(buildPromptUri(directIdentifier.project, directIdentifier.path));
  }

  let url;
  try {
    url = new URL(normalized, baseOrigin);
  } catch {
    url = null;
  }

  if (url) {
    if (url.protocol === 'prompt:') {
      return buildViewerPath(normalized);
    }

    const viewerIdentifier = identifierFromViewerUrl(url, baseOrigin);
    if (viewerIdentifier) return buildViewerPath(viewerIdentifier);

    const rawPath = parseProjectPathname(url.pathname, RAW_PREFIX);
    if (rawPath) return buildViewerPath(buildPromptUri(rawPath.project, rawPath.path));

    if (url.pathname === '/raw' || url.pathname === '/api/files/fetch') {
      const identifier = url.searchParams.get('identifier')?.trim();
      if (identifier) return buildViewerPath(identifier);
    }
  }

  const projectPath = normalized.replace(/^\/+/, '').split('/').filter(Boolean);
  if (projectPath.length >= 2) {
    return buildViewerPath(buildPromptUri(projectPath[0], `/${projectPath.slice(1).join('/')}`));
  }

  return buildViewerPath(normalized);
}
