export function stripTrailingSlashes(pathname: string): string {
  if (pathname === '/') return '/';

  const normalized = pathname.replace(/\/+$/u, '');
  return normalized || '/';
}

/**
 * Rewrites a request internally so routes behave identically with or without
 * trailing slashes. The browser-visible URL is unchanged because this is not a
 * redirect, and request methods, headers, query strings, and bodies are kept.
 */
export function normalizeTrailingSlashRequest(request: Request): Request {
  const url = new URL(request.url);
  const pathname = stripTrailingSlashes(url.pathname);
  if (pathname === url.pathname) return request;

  url.pathname = pathname;
  return new Request(url, request);
}
