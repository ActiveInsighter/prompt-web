import {
  buildFtsQuery,
  normalizeD1PromptFile,
  normalizePath,
  parseJson,
  parsePromptUri,
  type D1PromptFileRow,
} from '../lib/prompt-utils';
import type {
  AccessContext,
  BootstrapBundle,
  BootstrapContext,
  BootstrapManifest,
  DirectoryListing,
  Env,
  KvCommonPrompt,
  LibraryNodeRecord,
  ProjectRecord,
  PromptSearchOptions,
  PromptSearchResult,
  PromptVisibility,
} from '../types';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const MAX_BATCH_FILES = 10;

interface D1ProjectRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  visibility: PromptVisibility;
  default_language: string;
  metadata_json: string;
  created_at: string;
  updated_at: string;
}

interface D1NodeRow {
  id: string;
  project_id: string;
  parent_id: string | null;
  node_type: 'folder' | 'file';
  name: string;
  path: string;
  depth: number;
  sort_order: number;
  visibility: PromptVisibility | null;
  title: string | null;
  description: string | null;
  language: string | null;
  prompt_role: LibraryNodeRecord['promptRole'] | null;
  updated_at: string;
}

function clampLimit(limit?: number): number {
  if (!Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, Math.trunc(limit ?? DEFAULT_LIMIT)));
}

function normalizeText(value?: string): string | undefined {
  const normalized = value?.normalize('NFKC').trim();
  return normalized || undefined;
}

function normalizeProject(row: D1ProjectRow): ProjectRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    visibility: row.visibility,
    defaultLanguage: row.default_language,
    metadata: parseJson<Record<string, unknown>>(row.metadata_json, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeNode(row: D1NodeRow): LibraryNodeRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    parentId: row.parent_id,
    type: row.node_type,
    name: row.name,
    path: row.path,
    depth: Number(row.depth),
    sortOrder: Number(row.sort_order),
    visibility: row.visibility,
    title: row.title ?? undefined,
    description: row.description ?? undefined,
    language: row.language ?? undefined,
    promptRole: row.prompt_role ?? undefined,
    updatedAt: row.updated_at,
  };
}

function allowedVisibilities(
  access: AccessContext,
  requested?: PromptVisibility,
): PromptVisibility[] {
  if (!requested) return access.allowedVisibilities;
  return access.allowedVisibilities.includes(requested) ? [requested] : [];
}

function parseProjectPathIdentifier(identifier: string): { project: string; path: string } | null {
  const uri = parsePromptUri(identifier);
  if (uri) return uri;

  const match = identifier.match(/^([^:]+):(\/.*)$/u);
  if (!match) return null;
  return { project: match[1].trim(), path: normalizePath(match[2]) };
}

function isSafeKvSegment(value: string): boolean {
  return /^[a-z0-9_-]+$/iu.test(value);
}

export class PromptRepository {
  constructor(private readonly env: Env) {}

  async listProjects(access: AccessContext): Promise<ProjectRecord[]> {
    const placeholders = access.allowedVisibilities.map(() => '?').join(', ');
    const rows = await this.env.DB.prepare(
      `SELECT id, slug, name, description, visibility, default_language, metadata_json,
              created_at, updated_at
       FROM projects
       WHERE deleted_at IS NULL
         AND visibility IN (${placeholders})
       ORDER BY name COLLATE NOCASE ASC`,
    )
      .bind(...access.allowedVisibilities)
      .all<D1ProjectRow>();

    return rows.results.map(normalizeProject);
  }

  async listDirectory(
    projectIdentifier: string,
    requestedPath: string | undefined,
    access: AccessContext,
  ): Promise<DirectoryListing | null> {
    const project = await this.getProject(projectIdentifier, access);
    if (!project) return null;

    const path = normalizePath(requestedPath);
    let parentId: string | null = null;

    if (path !== '/') {
      const visibilityPlaceholders = access.allowedVisibilities.map(() => '?').join(', ');
      const folder = await this.env.DB.prepare(
        `SELECT n.id
         FROM nodes n
         JOIN projects p ON p.id = n.project_id
         WHERE n.project_id = ?
           AND n.path = ?
           AND n.node_type = 'folder'
           AND n.deleted_at IS NULL
           AND p.deleted_at IS NULL
           AND COALESCE(n.visibility, p.visibility) IN (${visibilityPlaceholders})
         LIMIT 1`,
      )
        .bind(project.id, path, ...access.allowedVisibilities)
        .first<{ id: string }>();
      if (!folder) return null;
      parentId = folder.id;
    }

    const visibilityPlaceholders = access.allowedVisibilities.map(() => '?').join(', ');
    const parentClause = parentId === null ? 'n.parent_id IS NULL' : 'n.parent_id = ?';
    const params: unknown[] = [project.id];
    if (parentId !== null) params.push(parentId);
    params.push(...access.allowedVisibilities);

    const rows = await this.env.DB.prepare(
      `SELECT n.id, n.project_id, n.parent_id, n.node_type, n.name, n.path, n.depth,
              n.sort_order, n.visibility, pf.title, pf.description, pf.language,
              pf.prompt_role, n.updated_at
       FROM nodes n
       JOIN projects p ON p.id = n.project_id
       LEFT JOIN prompt_files pf ON pf.node_id = n.id
       WHERE n.project_id = ?
         AND ${parentClause}
         AND n.deleted_at IS NULL
         AND p.deleted_at IS NULL
         AND COALESCE(n.visibility, p.visibility) IN (${visibilityPlaceholders})
       ORDER BY CASE n.node_type WHEN 'folder' THEN 0 ELSE 1 END,
                n.sort_order ASC,
                n.name COLLATE NOCASE ASC`,
    )
      .bind(...params)
      .all<D1NodeRow>();

    return { project, path, entries: rows.results.map(normalizeNode) };
  }

  async search(
    options: PromptSearchOptions,
    access: AccessContext,
  ): Promise<PromptSearchResult[]> {
    const visibilities = allowedVisibilities(access, options.visibility);
    if (visibilities.length === 0) return [];

    const clauses = [`d.visibility IN (${visibilities.map(() => '?').join(', ')})`];
    const params: unknown[] = [...visibilities];

    const project = normalizeText(options.project);
    if (project) {
      clauses.push('(lower(d.project_id) = lower(?) OR lower(d.project_slug) = lower(?))');
      params.push(project, project);
    }

    const directory = normalizePath(options.directory);
    if (options.directory && directory !== '/') {
      if (options.recursive === false) {
        clauses.push('d.parent_path = ?');
        params.push(directory);
      } else {
        clauses.push('(d.parent_path = ? OR d.path LIKE ?)');
        params.push(directory, `${directory}/%`);
      }
    }

    const language = normalizeText(options.language);
    if (language) {
      clauses.push('lower(d.language) = lower(?)');
      params.push(language);
    }

    if (options.promptRole) {
      clauses.push('d.prompt_role = ?');
      params.push(options.promptRole);
    }

    for (const tag of options.tags ?? []) {
      const normalizedTag = normalizeText(tag);
      if (!normalizedTag) continue;
      clauses.push("instr(',' || lower(d.tags_text) || ',', ',' || lower(?) || ',') > 0");
      params.push(normalizedTag);
    }

    const query = normalizeText(options.query);
    const limit = clampLimit(options.limit);
    let statement: D1PreparedStatement;

    if (query) {
      const ftsQuery = buildFtsQuery(query);
      const likeQuery = `%${query.toLowerCase()}%`;
      const ftsCte = ftsQuery
        ? `WITH fts_matches AS (
             SELECT file_id, bm25(prompt_search_fts) AS rank
             FROM prompt_search_fts
             WHERE prompt_search_fts MATCH ?
           )`
        : `WITH fts_matches AS (
             SELECT CAST(NULL AS TEXT) AS file_id, CAST(NULL AS REAL) AS rank WHERE 0
           )`;
      const sql = `${ftsCte}
        SELECT d.*, f.rank AS search_rank
        FROM prompt_search_documents d
        LEFT JOIN fts_matches f ON f.file_id = d.file_id
        WHERE ${clauses.join(' AND ')}
          AND (
            f.file_id IS NOT NULL
            OR lower(d.title) LIKE ?
            OR lower(d.file_name) LIKE ?
            OR lower(d.path) LIKE ?
            OR lower(d.description) LIKE ?
            OR lower(d.content) LIKE ?
            OR lower(d.tags_text) LIKE ?
          )
        ORDER BY
          CASE
            WHEN lower(d.title) = lower(?) THEN 0
            WHEN lower(d.file_name) = lower(?) THEN 1
            WHEN lower(d.path) = lower(?) THEN 2
            WHEN lower(d.title) LIKE ? THEN 3
            WHEN f.file_id IS NOT NULL THEN 4
            ELSE 5
          END,
          COALESCE(f.rank, 999999),
          d.updated_at DESC
        LIMIT ?`;

      const bindParams: unknown[] = [];
      if (ftsQuery) bindParams.push(ftsQuery);
      bindParams.push(
        ...params,
        likeQuery,
        likeQuery,
        likeQuery,
        likeQuery,
        likeQuery,
        likeQuery,
        query,
        query,
        normalizePath(query),
        likeQuery,
        limit,
      );
      statement = this.env.DB.prepare(sql).bind(...bindParams);
    } else {
      statement = this.env.DB.prepare(
        `SELECT d.*, NULL AS search_rank
         FROM prompt_search_documents d
         WHERE ${clauses.join(' AND ')}
         ORDER BY d.updated_at DESC
         LIMIT ?`,
      ).bind(...params, limit);
    }

    const rows = await statement.all<D1PromptFileRow>();
    return rows.results.map((row) => {
      const { content: _content, ...result } = normalizeD1PromptFile(row);
      return { ...result, score: row.search_rank ?? undefined };
    });
  }

  async get(identifier: string, access: AccessContext) {
    const normalizedIdentifier = normalizeText(identifier);
    if (!normalizedIdentifier) return null;

    const visibilities = access.allowedVisibilities;
    const placeholders = visibilities.map(() => '?').join(', ');
    const projectPath = parseProjectPathIdentifier(normalizedIdentifier);
    let statement: D1PreparedStatement;

    if (projectPath) {
      statement = this.env.DB.prepare(
        `SELECT d.*, NULL AS search_rank
         FROM prompt_search_documents d
         WHERE d.visibility IN (${placeholders})
           AND (lower(d.project_id) = lower(?) OR lower(d.project_slug) = lower(?))
           AND lower(d.path) = lower(?)
         LIMIT 1`,
      ).bind(...visibilities, projectPath.project, projectPath.project, projectPath.path);
    } else {
      const path = normalizePath(
        normalizedIdentifier.endsWith('.md') ? normalizedIdentifier : `${normalizedIdentifier}.md`,
      );
      statement = this.env.DB.prepare(
        `SELECT d.*, NULL AS search_rank
         FROM prompt_search_documents d
         WHERE d.visibility IN (${placeholders})
           AND (d.file_id = ? OR lower(d.path) = lower(?))
         ORDER BY CASE WHEN d.file_id = ? THEN 0 ELSE 1 END
         LIMIT 1`,
      ).bind(...visibilities, normalizedIdentifier, path, normalizedIdentifier);
    }

    const row = await statement.first<D1PromptFileRow>();
    return row ? normalizeD1PromptFile(row) : null;
  }

  async getMany(identifiers: string[], access: AccessContext) {
    const unique = [...new Set(identifiers.map((value) => value.trim()).filter(Boolean))].slice(
      0,
      MAX_BATCH_FILES,
    );
    return Promise.all(unique.map((identifier) => this.get(identifier, access)));
  }

  async getBootstrapContext(client: string, profile: string): Promise<BootstrapContext | null> {
    const normalizedClient = client.toLowerCase().trim();
    const normalizedProfile = profile.toLowerCase().trim();
    if (!isSafeKvSegment(normalizedClient) || !isSafeKvSegment(normalizedProfile)) return null;

    const manifestKey = `manifest:bootstrap:${normalizedClient}:${normalizedProfile}`;
    const manifest = await this.env.PROMPT_KV.get<BootstrapManifest>(manifestKey, 'json');
    if (!manifest?.bundleKey) return null;

    const bundle = await this.env.PROMPT_KV.get<BootstrapBundle>(manifest.bundleKey, 'json');
    if (!bundle?.content) return null;

    return {
      ...bundle,
      client: normalizedClient,
      profile: normalizedProfile,
      sourceKey: manifest.bundleKey,
    };
  }

  async getCommonPrompt(key: string): Promise<KvCommonPrompt | null> {
    const normalizedKey = key.normalize('NFKC').trim();
    if (!normalizedKey.startsWith('common:')) return null;
    return (await this.env.PROMPT_KV.get<KvCommonPrompt>(normalizedKey, 'json')) ?? null;
  }

  private async getProject(
    identifier: string,
    access: AccessContext,
  ): Promise<ProjectRecord | null> {
    const normalized = normalizeText(identifier);
    if (!normalized) return null;
    const placeholders = access.allowedVisibilities.map(() => '?').join(', ');
    const row = await this.env.DB.prepare(
      `SELECT id, slug, name, description, visibility, default_language, metadata_json,
              created_at, updated_at
       FROM projects
       WHERE deleted_at IS NULL
         AND visibility IN (${placeholders})
         AND (lower(id) = lower(?) OR lower(slug) = lower(?))
       LIMIT 1`,
    )
      .bind(...access.allowedVisibilities, normalized, normalized)
      .first<D1ProjectRow>();

    return row ? normalizeProject(row) : null;
  }
}
