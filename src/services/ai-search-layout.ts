export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_JOB_ATTEMPTS = 5;
export const JOB_LEASE_SECONDS = 120;
export const DEFAULT_PROCESS_LIMIT = 3;
export const MAX_PROCESS_LIMIT = 10;
export const MAX_INSTANCE_ID_LENGTH = 64;
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
 * AI Search instance names are intentionally human-readable. The normalized
 * project slug is the complete identity shown in Cloudflare; no database ID,
 * hash suffix, or silent truncation is allowed.
 */
export function buildProjectAiSearchInstanceId(slug: string): string {
  const instanceId = slug
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/gu, '-')
    .replace(/^-+|-+$/gu, '');

  if (!instanceId) {
    throw new RangeError(`Project slug cannot produce an AI Search instance name: ${slug}`);
  }
  if (instanceId.length > MAX_INSTANCE_ID_LENGTH) {
    throw new RangeError(
      `Project slug is too long for a readable AI Search instance name (${instanceId.length} > ${MAX_INSTANCE_ID_LENGTH}): ${slug}`,
    );
  }
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

function readableFrontmatterLines(frontmatter: string): string[] {
  return frontmatter
    .split(/\r?\n/gu)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.endsWith(':'))
    .map((line) => line.replace(/^-\s*/u, '').replace(/^([\w-]+):\s*/u, '$1: '));
}

/**
 * Cloudflare's Markdown converter rejects documents that contain only YAML
 * frontmatter. D1 remains the source of truth, while AI Search receives a
 * deterministic searchable projection under the exact same source-path key.
 */
export function buildAiSearchUploadContent(
  sourcePath: string,
  content: string,
  format: 'markdown' | 'text' | 'json',
): string {
  if (format !== 'markdown') return content;

  const normalized = content.replace(/^\uFEFF/u, '');
  const frontmatterMatch = normalized.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n)?([\s\S]*)$/u);
  if (!frontmatterMatch || frontmatterMatch[2].trim().length > 0) return content;

  const readable = readableFrontmatterLines(frontmatterMatch[1]);
  const itemKey = buildAiSearchItemKey(sourcePath);
  const title = itemKey.split('/').at(-1)?.replace(/\.[^.]+$/u, '') || itemKey;
  return [
    `# ${title}`,
    '',
    `Source: ${itemKey}`,
    '',
    ...readable,
  ].join('\n');
}

export function buildAiSearchIndexHash(fileSyncHash: string, projectConfigHash: string): string {
  return `${fileSyncHash}|${projectConfigHash}`;
}

export function aiSearchRetryDelaySeconds(attempts: number): number {
  return Math.min(3600, 30 * 2 ** Math.max(0, attempts - 1));
}
