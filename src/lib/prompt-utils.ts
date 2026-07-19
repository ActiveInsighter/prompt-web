import type { PromptFileRecord, PromptRole, PromptVisibility } from '../types';

export interface D1PromptFileRow {
  file_id: string;
  project_id: string;
  project_slug: string;
  project_name: string;
  path: string;
  parent_path: string;
  file_name: string;
  title: string;
  description: string;
  content: string;
  language: string;
  format: 'markdown' | 'text' | 'json';
  prompt_role: PromptRole;
  visibility: PromptVisibility;
  tags_text: string;
  variables_json: string;
  metadata_json: string;
  current_version: number;
  created_at: string;
  updated_at: string;
  search_rank?: number | null;
}

export function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function normalizePath(value?: string): string {
  const normalized = (value ?? '/')
    .normalize('NFKC')
    .trim()
    .replace(/\\/g, '/')
    .replace(/\/{2,}/g, '/');

  if (!normalized || normalized === '/') return '/';
  const withLeadingSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return withLeadingSlash.replace(/\/$/, '');
}

export function createPromptUri(projectSlug: string, path: string): string {
  const encodedPath = normalizePath(path)
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join('/');
  return `prompt://${encodeURIComponent(projectSlug)}/${encodedPath}`;
}

export function parsePromptUri(identifier: string): { project: string; path: string } | null {
  if (!identifier.toLowerCase().startsWith('prompt://')) return null;
  const remainder = identifier.slice('prompt://'.length);
  const separator = remainder.indexOf('/');
  if (separator <= 0) return null;

  try {
    const project = decodeURIComponent(remainder.slice(0, separator));
    const path = normalizePath(
      remainder
        .slice(separator + 1)
        .split('/')
        .map((part) => decodeURIComponent(part))
        .join('/'),
    );
    return { project, path };
  } catch {
    return null;
  }
}

export function normalizeD1PromptFile(row: D1PromptFileRow): PromptFileRecord {
  return {
    id: row.file_id,
    projectId: row.project_id,
    projectSlug: row.project_slug,
    projectName: row.project_name,
    path: row.path,
    parentPath: row.parent_path,
    fileName: row.file_name,
    uri: createPromptUri(row.project_slug, row.path),
    title: row.title,
    description: row.description,
    content: row.content,
    language: row.language,
    format: row.format,
    promptRole: row.prompt_role,
    visibility: row.visibility,
    tags: row.tags_text
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    variables: parseJson<string[]>(row.variables_json, []),
    metadata: parseJson<Record<string, unknown>>(row.metadata_json, {}),
    currentVersion: Number(row.current_version),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function buildFtsQuery(query: string): string {
  const tokens = query
    .normalize('NFKC')
    .trim()
    .split(/\s+/u)
    .map((token) => token.replace(/["*:^(){}\[\]]/g, '').trim())
    .filter(Boolean);

  return tokens.map((token) => `"${token}"*`).join(' AND ');
}

export function renderPromptTemplate(
  template: string,
  values: Record<string, string | number | boolean>,
): { rendered: string; missingVariables: string[] } {
  const missing = new Set<string>();
  const rendered = template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_match, key: string) => {
    if (!(key in values)) {
      missing.add(key);
      return `{{${key}}}`;
    }
    return String(values[key]);
  });

  return { rendered, missingVariables: [...missing] };
}
