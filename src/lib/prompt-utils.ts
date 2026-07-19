import type { PromptRecord, PromptVisibility } from '../types';

export interface D1PromptRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  category: string;
  language: string;
  visibility: PromptVisibility;
  tags_text: string;
  variables_json: string;
  metadata_json: string;
  created_at: string;
  updated_at: string;
  search_rank?: number | null;
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function normalizeD1Prompt(row: D1PromptRow): PromptRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    content: row.content,
    category: row.category,
    language: row.language,
    visibility: row.visibility,
    tags: row.tags_text
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    variables: parseJson<string[]>(row.variables_json, []),
    metadata: parseJson<Record<string, unknown>>(row.metadata_json, {}),
    source: 'd1',
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
