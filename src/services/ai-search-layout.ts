export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_JOB_ATTEMPTS = 5;
export const JOB_LEASE_SECONDS = 120;
export const DEFAULT_PROCESS_LIMIT = 3;
export const MAX_PROCESS_LIMIT = 10;
export const READABLE_LAYOUT_VERSION = 'readable-v1';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (isRecord(error) && typeof error.message === 'string') return error.message;
  return String(error);
}

export function errorStatus(error: unknown): number | undefined {
  if (!isRecord(error)) return undefined;
  for (const candidate of [error.status, error.statusCode, error.httpStatus, error.responseStatus]) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate;
  }
  return undefined;
}

export function isNotFoundError(error: unknown): boolean {
  return errorStatus(error) === 404 || /not[ -]?found|does not exist/iu.test(errorMessage(error));
}

export function clampProcessLimit(limit?: number): number {
  if (!Number.isFinite(limit)) return DEFAULT_PROCESS_LIMIT;
  return Math.min(MAX_PROCESS_LIMIT, Math.max(1, Math.trunc(limit ?? DEFAULT_PROCESS_LIMIT)));
}

/** A deterministic, non-cryptographic token used only for internal job deduplication. */
export function stableAiSearchToken(value: string): string {
  let left = 0x811c9dc5;
  let right = 0x9e3779b9;
  for (const character of value.normalize('NFKC')) {
    const codePoint = character.codePointAt(0) ?? 0;
    left = Math.imul(left ^ codePoint, 0x01000193);
    right = Math.imul(right ^ codePoint, 0x85ebca6b);
  }
  return `${(left >>> 0).toString(36)}${(right >>> 0).toString(36)}`.padStart(13, '0');
}

/**
 * AI Search instance names are intentionally human-readable. The project slug
 * is the identity shown in the Cloudflare dashboard; no database ID or hash is
 * appended.
 */
export function buildProjectAiSearchInstanceId(slug: string): string {
  const instanceId = slug
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 64)
    .replace(/-+$/gu, '');

  if (!instanceId) throw new RangeError(`Project slug cannot produce an AI Search instance name: ${slug}`);
  if (!/^[a-z0-9_]+(?:-[a-z0-9_]+)*$/u.test(instanceId)) {
    throw new RangeError(`Invalid AI Search instance name derived from project slug: ${slug}`);
  }
  return instanceId;
}

/** Preserve the project-relative source path as the visible AI Search item key. */
export function buildAiSearchItemKey(sourcePath: string): string {
  const normalized = sourcePath.normalize('NFC').replace(/\\/gu, '/').replace(/^\/+|\/+$/gu, '');
  const segments = normalized.split('/').filter((segment) => segment && segment !== '.');
  if (segments.length === 0 || segments.some((segment) => segment === '..')) {
    throw new RangeError(`Invalid source path for AI Search item: ${sourcePath}`);
  }
  return segments.join('/');
}

export function buildAiSearchIndexHash(fileSyncHash: string, projectConfigHash: string): string {
  return `${fileSyncHash}|${projectConfigHash}`;
}

export function aiSearchRetryDelaySeconds(attempts: number): number {
  return Math.min(3600, 30 * 2 ** Math.max(0, attempts - 1));
}
