import type { AccessContext } from './types';

function extractBearerToken(request: Request): string | null {
  const authorization = request.headers.get('authorization');
  if (!authorization) return null;

  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function constantTimeEqual(left: string, right: string): boolean {
  const encoder = new TextEncoder();
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let difference = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return difference === 0;
}

export function hasValidBearerToken(request: Request, configuredToken?: string): boolean {
  const candidate = extractBearerToken(request);
  return Boolean(configuredToken && candidate && constantTimeEqual(candidate, configuredToken));
}

export function resolveAccessContext(request: Request, configuredToken?: string): AccessContext {
  const authenticated = hasValidBearerToken(request, configuredToken);
  return authenticated
    ? { authenticated: true, allowedVisibilities: ['public', 'private'] }
    : { authenticated: false, allowedVisibilities: ['public'] };
}
