import { buildFtsQuery, normalizeD1Prompt, type D1PromptRow } from '../lib/prompt-utils';
import type {
  AccessContext,
  Env,
  KvPromptIndexEntry,
  PromptRecord,
  PromptSearchOptions,
  PromptSearchResult,
  PromptVisibility,
} from '../types';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function clampLimit(limit?: number): number {
  if (!Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, Math.trunc(limit ?? DEFAULT_LIMIT)));
}

function normalizeText(value?: string): string | undefined {
  const normalized = value?.normalize('NFKC').trim();
  return normalized || undefined;
}

function allowedVisibilities(
  access: AccessContext,
  requested?: PromptVisibility,
): PromptVisibility[] {
  if (!requested) return access.allowedVisibilities;
  return access.allowedVisibilities.includes(requested) ? [requested] : [];
}

function buildD1Filters(
  options: PromptSearchOptions,
  access: AccessContext,
): { clauses: string[]; params: unknown[]; visibilities: PromptVisibility[] } {
  const visibilities = allowedVisibilities(access, options.visibility);
  if (visibilities.length === 0) return { clauses: ['1 = 0'], params: [], visibilities };

  const clauses = [
    'p.deleted_at IS NULL',
    `p.visibility IN (${visibilities.map(() => '?').join(', ')})`,
  ];
  const params: unknown[] = [...visibilities];

  const category = normalizeText(options.category);
  if (category) {
    clauses.push('lower(p.category) = lower(?)');
    params.push(category);
  }

  const language = normalizeText(options.language);
  if (language) {
    clauses.push('lower(p.language) = lower(?)');
    params.push(language);
  }

  for (const tag of options.tags ?? []) {
    const normalizedTag = normalizeText(tag);
    if (!normalizedTag) continue;
    clauses.push("instr(',' || lower(p.tags_text) || ',', ',' || lower(?) || ',') > 0");
    params.push(normalizedTag);
  }

  return { clauses, params, visibilities };
}

function textMatches(entry: KvPromptIndexEntry, query: string): boolean {
  const haystack = [entry.title, entry.description, entry.category, ...entry.tags]
    .join(' ')
    .normalize('NFKC')
    .toLowerCase();
  return query
    .normalize('NFKC')
    .toLowerCase()
    .split(/\s+/u)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export class PromptRepository {
  constructor(private readonly env: Env) {}

  async search(
    options: PromptSearchOptions,
    access: AccessContext,
  ): Promise<PromptSearchResult[]> {
    const [d1Prompts, kvPrompts] = await Promise.all([
      this.searchD1(options, access),
      this.searchKv(options, access),
    ]);

    const deduplicated = new Map<string, PromptSearchResult>();
    for (const prompt of [...d1Prompts, ...kvPrompts]) {
      const key = prompt.slug.toLowerCase();
      if (!deduplicated.has(key)) deduplicated.set(key, prompt);
    }

    return [...deduplicated.values()]
      .sort((left, right) => {
        const scoreDelta = (left.score ?? Number.POSITIVE_INFINITY)
          - (right.score ?? Number.POSITIVE_INFINITY);
        if (scoreDelta !== 0) return scoreDelta;
        return right.updatedAt.localeCompare(left.updatedAt);
      })
      .slice(0, clampLimit(options.limit));
  }

  async get(identifier: string, access: AccessContext): Promise<PromptRecord | null> {
    const normalizedIdentifier = normalizeText(identifier);
    if (!normalizedIdentifier) return null;

    const placeholders = access.allowedVisibilities.map(() => '?').join(', ');
    const row = await this.env.DB.prepare(
      `SELECT p.*
       FROM prompts p
       WHERE p.deleted_at IS NULL
         AND p.visibility IN (${placeholders})
         AND (p.id = ? OR lower(p.slug) = lower(?))
       LIMIT 1`,
    )
      .bind(...access.allowedVisibilities, normalizedIdentifier, normalizedIdentifier)
      .first<D1PromptRow>();

    if (row) return normalizeD1Prompt(row);
    if (!access.allowedVisibilities.includes('public')) return null;

    const direct = await this.env.PROMPT_KV.get<PromptRecord>(normalizedIdentifier, 'json');
    if (direct?.visibility === 'public') return direct;

    const index = await this.getKvIndex();
    const indexed = index.find(
      (entry) => entry.id === normalizedIdentifier || entry.slug === normalizedIdentifier,
    );
    if (!indexed) return null;

    const prompt = await this.env.PROMPT_KV.get<PromptRecord>(indexed.key, 'json');
    return prompt?.visibility === 'public' ? prompt : null;
  }

  async listCategories(access: AccessContext): Promise<Array<{ category: string; count: number }>> {
    const placeholders = access.allowedVisibilities.map(() => '?').join(', ');
    const d1Rows = await this.env.DB.prepare(
      `SELECT category, COUNT(*) AS count
       FROM prompts
       WHERE deleted_at IS NULL
         AND visibility IN (${placeholders})
       GROUP BY category
       ORDER BY category ASC`,
    )
      .bind(...access.allowedVisibilities)
      .all<{ category: string; count: number }>();

    const counts = new Map<string, number>();
    for (const row of d1Rows.results) counts.set(row.category, Number(row.count));

    if (access.allowedVisibilities.includes('public')) {
      for (const entry of await this.getKvIndex()) {
        counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((left, right) => left.category.localeCompare(right.category));
  }

  private async searchD1(
    options: PromptSearchOptions,
    access: AccessContext,
  ): Promise<PromptSearchResult[]> {
    const { clauses, params, visibilities } = buildD1Filters(options, access);
    if (visibilities.length === 0) return [];

    const query = normalizeText(options.query);
    const limit = clampLimit(options.limit);
    let statement: D1PreparedStatement;

    if (query) {
      const ftsQuery = buildFtsQuery(query);
      const likeQuery = `%${query.toLowerCase()}%`;
      const sql = `
        WITH fts_matches AS (
          SELECT rowid, bm25(prompts_fts, 8.0, 4.0, 1.2, 2.0, 1.2) AS rank
          FROM prompts_fts
          WHERE prompts_fts MATCH ?
        )
        SELECT p.*, f.rank AS search_rank
        FROM prompts p
        LEFT JOIN fts_matches f ON f.rowid = p.rowid
        WHERE (${clauses.join(' AND ')})
          AND (
            f.rowid IS NOT NULL
            OR lower(p.title) LIKE ?
            OR lower(p.description) LIKE ?
            OR lower(p.content) LIKE ?
            OR lower(p.tags_text) LIKE ?
          )
        ORDER BY
          CASE
            WHEN lower(p.title) = lower(?) THEN 0
            WHEN lower(p.title) LIKE ? THEN 1
            WHEN f.rowid IS NOT NULL THEN 2
            ELSE 3
          END,
          COALESCE(f.rank, 999999),
          p.updated_at DESC
        LIMIT ?`;

      statement = this.env.DB.prepare(sql).bind(
        ftsQuery,
        ...params,
        likeQuery,
        likeQuery,
        likeQuery,
        likeQuery,
        query,
        likeQuery,
        limit,
      );
    } else {
      statement = this.env.DB.prepare(
        `SELECT p.*, NULL AS search_rank
         FROM prompts p
         WHERE ${clauses.join(' AND ')}
         ORDER BY p.updated_at DESC
         LIMIT ?`,
      ).bind(...params, limit);
    }

    const rows = await statement.all<D1PromptRow>();
    return rows.results.map((row) => ({
      ...normalizeD1Prompt(row),
      score: row.search_rank ?? undefined,
    }));
  }

  private async searchKv(
    options: PromptSearchOptions,
    access: AccessContext,
  ): Promise<PromptSearchResult[]> {
    if (!access.allowedVisibilities.includes('public')) return [];
    if (options.visibility && options.visibility !== 'public') return [];

    const query = normalizeText(options.query);
    const category = normalizeText(options.category)?.toLowerCase();
    const language = normalizeText(options.language)?.toLowerCase();
    const tags = (options.tags ?? []).map((tag) => tag.toLowerCase());

    const matchingEntries = (await this.getKvIndex())
      .filter((entry) => !query || textMatches(entry, query))
      .filter((entry) => !category || entry.category.toLowerCase() === category)
      .filter((entry) => !language || entry.language.toLowerCase() === language)
      .filter((entry) => tags.every((tag) => entry.tags.some((item) => item.toLowerCase() === tag)))
      .slice(0, clampLimit(options.limit));

    const prompts = await Promise.all(
      matchingEntries.map((entry) => this.env.PROMPT_KV.get<PromptRecord>(entry.key, 'json')),
    );

    return prompts
      .filter((prompt): prompt is PromptRecord => prompt?.visibility === 'public')
      .map((prompt, index) => ({ ...prompt, score: 1000 + index }));
  }

  private async getKvIndex(): Promise<KvPromptIndexEntry[]> {
    return (await this.env.PROMPT_KV.get<KvPromptIndexEntry[]>('index:public', 'json')) ?? [];
  }
}
