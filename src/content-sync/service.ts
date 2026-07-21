import type {
  ContentFile,
  ContentFolder,
  ContentManifest,
  ContentProject,
  ContentSyncRequest,
} from './schema';
import type { Env } from '../types';

type EntityType = 'project' | 'folder' | 'file';

interface SyncEntryRow {
  sync_key: string;
  entity_type: EntityType;
  entity_id: string;
  project_id: string;
  source_path: string;
  content_hash: string;
  last_seen_run_id: string;
  updated_at: string;
}

interface RecentRunRow {
  id: string;
  source: string;
  manifest_hash: string;
  status: string;
  prune_requested: number;
  stats_json: string;
  error_text: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface SyncEntityStats {
  created: number;
  updated: number;
  moved: number;
  unchanged: number;
  deleted: number;
}

export interface ContentSyncPlan {
  manifestHash: string;
  prune: boolean;
  projects: SyncEntityStats;
  folders: SyncEntityStats;
  files: SyncEntityStats;
  deletions: Array<{
    syncKey: string;
    entityType: EntityType;
    entityId: string;
    projectId: string;
    sourcePath: string;
  }>;
}

interface ContentSyncAnalysis {
  plan: ContentSyncPlan;
  existing: Map<string, SyncEntryRow>;
}

export interface ContentSyncResult {
  dryRun: boolean;
  runId: string | null;
  skipped: boolean;
  plan: ContentSyncPlan;
}

const EMPTY_STATS = (): SyncEntityStats => ({
  created: 0,
  updated: 0,
  moved: 0,
  unchanged: 0,
  deleted: 0,
});

const MAX_BATCH_STATEMENTS = 80;

function normalizeTag(value: string): string {
  return value.normalize('NFKC').trim().toLowerCase();
}

function entityKey(entityType: EntityType, entityId: string): string {
  return `${entityType}:${entityId}`;
}

function parentPath(path: string): string {
  const index = path.lastIndexOf('/');
  return index <= 0 ? '/' : path.slice(0, index);
}

function pathDepth(path: string): number {
  return path.split('/').filter(Boolean).length - 1;
}

export function contentSyncEntryNeedsUpdate(
  entry: Pick<SyncEntryRow, 'source_path' | 'content_hash'> | undefined,
  sourcePath: string,
  contentHash: string,
): boolean {
  return !entry || entry.source_path !== sourcePath || entry.content_hash !== contentHash;
}

export function hasContentSyncPlanMutations(plan: ContentSyncPlan): boolean {
  const hasEntityMutations = [plan.projects, plan.folders, plan.files].some(
    (stats) => stats.created > 0 || stats.updated > 0 || stats.moved > 0 || stats.deleted > 0,
  );
  return hasEntityMutations || plan.deletions.length > 0;
}

function validateManifestReferences(manifest: ContentManifest): void {
  const projectIds = new Set<string>();
  const projectSlugs = new Set<string>();
  const folderIds = new Set<string>();
  const entityIds = new Set<string>();
  const activePaths = new Set<string>();

  for (const project of manifest.projects) {
    if (projectIds.has(project.id)) throw new Error(`Duplicate project id: ${project.id}`);
    if (projectSlugs.has(project.slug)) throw new Error(`Duplicate project slug: ${project.slug}`);
    projectIds.add(project.id);
    projectSlugs.add(project.slug);
    entityIds.add(entityKey('project', project.id));
  }

  const sortedFolders = [...manifest.folders].sort((left, right) => left.depth - right.depth);
  for (const folder of sortedFolders) {
    if (!projectIds.has(folder.projectId)) {
      throw new Error(`Folder ${folder.id} references missing project ${folder.projectId}.`);
    }
    if (folderIds.has(folder.id)) throw new Error(`Duplicate folder id: ${folder.id}`);
    if (folder.depth !== pathDepth(folder.path)) {
      throw new Error(`Folder ${folder.id} has an invalid depth for ${folder.path}.`);
    }
    if (folder.name !== folder.path.split('/').filter(Boolean).at(-1)) {
      throw new Error(`Folder ${folder.id} name does not match its path.`);
    }
    if (folder.parentId) {
      const parent = sortedFolders.find((candidate) => candidate.id === folder.parentId);
      if (!parent || parent.projectId !== folder.projectId) {
        throw new Error(`Folder ${folder.id} references an invalid parent.`);
      }
      if (parent.path !== parentPath(folder.path)) {
        throw new Error(`Folder ${folder.id} parent path does not match ${folder.path}.`);
      }
    } else if (parentPath(folder.path) !== '/') {
      throw new Error(`Nested folder ${folder.id} must declare a parent.`);
    }

    const pathKey = `${folder.projectId}:${folder.path.toLocaleLowerCase('en-US')}`;
    if (activePaths.has(pathKey)) throw new Error(`Duplicate project path: ${folder.path}`);
    activePaths.add(pathKey);
    folderIds.add(folder.id);
    entityIds.add(entityKey('folder', folder.id));
  }

  const fileIds = new Set<string>();
  for (const file of manifest.files) {
    if (!projectIds.has(file.projectId)) {
      throw new Error(`File ${file.id} references missing project ${file.projectId}.`);
    }
    if (fileIds.has(file.id)) throw new Error(`Duplicate file id: ${file.id}`);
    if (file.depth !== pathDepth(file.path)) {
      throw new Error(`File ${file.id} has an invalid depth for ${file.path}.`);
    }
    if (file.name !== file.path.split('/').filter(Boolean).at(-1)) {
      throw new Error(`File ${file.id} name does not match its path.`);
    }
    if (file.parentId) {
      const parent = manifest.folders.find((folder) => folder.id === file.parentId);
      if (!parent || parent.projectId !== file.projectId) {
        throw new Error(`File ${file.id} references an invalid parent.`);
      }
      if (parent.path !== parentPath(file.path)) {
        throw new Error(`File ${file.id} parent path does not match ${file.path}.`);
      }
    } else if (parentPath(file.path) !== '/') {
      throw new Error(`Nested file ${file.id} must declare a parent.`);
    }

    const pathKey = `${file.projectId}:${file.path.toLocaleLowerCase('en-US')}`;
    if (activePaths.has(pathKey)) throw new Error(`Duplicate project path: ${file.path}`);
    activePaths.add(pathKey);
    fileIds.add(file.id);
    entityIds.add(entityKey('file', file.id));
  }

  if (entityIds.size !== manifest.projects.length + manifest.folders.length + manifest.files.length) {
    throw new Error('Stable identifiers must be unique within each entity type.');
  }
}

async function executeStatementGroups(
  db: D1Database,
  groups: D1PreparedStatement[][],
): Promise<void> {
  let current: D1PreparedStatement[] = [];
  for (const group of groups) {
    if (group.length > MAX_BATCH_STATEMENTS) {
      throw new Error('A content sync operation generated too many statements for one entity.');
    }
    if (current.length > 0 && current.length + group.length > MAX_BATCH_STATEMENTS) {
      await db.batch(current);
      current = [];
    }
    current.push(...group);
  }
  if (current.length > 0) await db.batch(current);
}

function upsertSyncEntry(
  env: Env,
  runId: string,
  entityType: EntityType,
  entityId: string,
  projectId: string,
  sourcePath: string,
  contentHash: string,
): D1PreparedStatement {
  return env.DB.prepare(
    `INSERT INTO content_sync_entries(
       sync_key, entity_type, entity_id, project_id, source_path,
       content_hash, last_seen_run_id, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
     ON CONFLICT(sync_key) DO UPDATE SET
       entity_type = excluded.entity_type,
       entity_id = excluded.entity_id,
       project_id = excluded.project_id,
       source_path = excluded.source_path,
       content_hash = excluded.content_hash,
       last_seen_run_id = excluded.last_seen_run_id,
       updated_at = excluded.updated_at
     WHERE content_sync_entries.entity_type IS NOT excluded.entity_type
        OR content_sync_entries.entity_id IS NOT excluded.entity_id
        OR content_sync_entries.project_id IS NOT excluded.project_id
        OR content_sync_entries.source_path IS NOT excluded.source_path
        OR content_sync_entries.content_hash IS NOT excluded.content_hash`,
  ).bind(
    entityKey(entityType, entityId),
    entityType,
    entityId,
    projectId,
    sourcePath,
    contentHash,
    runId,
  );
}

function projectStatements(env: Env, project: ContentProject, runId: string): D1PreparedStatement[] {
  const metadataJson = JSON.stringify(project.metadata);
  return [
    env.DB.prepare(
      `INSERT INTO projects(
         id, slug, name, description, visibility, default_language, metadata_json,
         updated_at, deleted_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), NULL)
       ON CONFLICT(id) DO UPDATE SET
         slug = excluded.slug,
         name = excluded.name,
         description = excluded.description,
         visibility = excluded.visibility,
         default_language = excluded.default_language,
         metadata_json = excluded.metadata_json,
         updated_at = excluded.updated_at,
         deleted_at = NULL
       WHERE projects.slug IS NOT excluded.slug
          OR projects.name IS NOT excluded.name
          OR projects.description IS NOT excluded.description
          OR projects.visibility IS NOT excluded.visibility
          OR projects.default_language IS NOT excluded.default_language
          OR projects.metadata_json IS NOT excluded.metadata_json
          OR projects.deleted_at IS NOT NULL`,
    ).bind(
      project.id,
      project.slug,
      project.name,
      project.description,
      project.visibility,
      project.defaultLanguage,
      metadataJson,
    ),
    upsertSyncEntry(
      env,
      runId,
      'project',
      project.id,
      project.id,
      project.sourcePath,
      project.configHash,
    ),
  ];
}

function folderStatements(env: Env, folder: ContentFolder, runId: string): D1PreparedStatement[] {
  return [
    env.DB.prepare(
      `INSERT INTO nodes(
         id, project_id, parent_id, node_type, name, path, depth,
         sort_order, visibility, updated_at, deleted_at
       ) VALUES (?, ?, ?, 'folder', ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), NULL)
       ON CONFLICT(id) DO UPDATE SET
         project_id = excluded.project_id,
         parent_id = excluded.parent_id,
         node_type = 'folder',
         name = excluded.name,
         path = excluded.path,
         depth = excluded.depth,
         sort_order = excluded.sort_order,
         visibility = excluded.visibility,
         updated_at = excluded.updated_at,
         deleted_at = NULL
       WHERE nodes.project_id IS NOT excluded.project_id
          OR nodes.parent_id IS NOT excluded.parent_id
          OR nodes.node_type IS NOT 'folder'
          OR nodes.name IS NOT excluded.name
          OR nodes.path IS NOT excluded.path
          OR nodes.depth IS NOT excluded.depth
          OR nodes.sort_order IS NOT excluded.sort_order
          OR nodes.visibility IS NOT excluded.visibility
          OR nodes.deleted_at IS NOT NULL`,
    ).bind(
      folder.id,
      folder.projectId,
      folder.parentId,
      folder.name,
      folder.path,
      folder.depth,
      folder.sortOrder,
      folder.visibility,
    ),
    upsertSyncEntry(
      env,
      runId,
      'folder',
      folder.id,
      folder.projectId,
      folder.sourcePath,
      folder.configHash,
    ),
  ];
}

function fileStatements(env: Env, file: ContentFile, runId: string): D1PreparedStatement[] {
  const tags = [...new Map(file.tags.map((tag) => [normalizeTag(tag), tag.trim()])).entries()]
    .filter(([normalized]) => normalized)
    .map(([normalized, display]) => ({ normalized, display }));
  const tagsText = tags.map(({ display }) => display).join(',');
  const variablesJson = JSON.stringify([...new Set(file.variables)]);
  const metadataJson = JSON.stringify(file.metadata);

  const statements: D1PreparedStatement[] = [
    env.DB.prepare(
      `INSERT INTO nodes(
         id, project_id, parent_id, node_type, name, path, depth,
         sort_order, visibility, updated_at, deleted_at
       ) VALUES (?, ?, ?, 'file', ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), NULL)
       ON CONFLICT(id) DO UPDATE SET
         project_id = excluded.project_id,
         parent_id = excluded.parent_id,
         node_type = 'file',
         name = excluded.name,
         path = excluded.path,
         depth = excluded.depth,
         sort_order = excluded.sort_order,
         visibility = excluded.visibility,
         updated_at = excluded.updated_at,
         deleted_at = NULL
       WHERE nodes.project_id IS NOT excluded.project_id
          OR nodes.parent_id IS NOT excluded.parent_id
          OR nodes.node_type IS NOT 'file'
          OR nodes.name IS NOT excluded.name
          OR nodes.path IS NOT excluded.path
          OR nodes.depth IS NOT excluded.depth
          OR nodes.sort_order IS NOT excluded.sort_order
          OR nodes.visibility IS NOT excluded.visibility
          OR nodes.deleted_at IS NOT NULL`,
    ).bind(
      file.id,
      file.projectId,
      file.parentId,
      file.name,
      file.path,
      file.depth,
      file.sortOrder,
      file.visibility,
    ),
    env.DB.prepare(
      `INSERT OR IGNORE INTO prompt_files(
         node_id, title, description, content, language, format, prompt_role,
         variables_json, metadata_json, tags_text, content_hash, current_version
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    ).bind(
      file.id,
      file.title,
      file.description,
      file.content,
      file.language,
      file.format,
      file.promptRole,
      variablesJson,
      metadataJson,
      tagsText,
      file.contentHash,
    ),
    env.DB.prepare(
      `INSERT OR IGNORE INTO prompt_file_versions(
         file_id, version_number, content, variables_json, metadata_json,
         change_note, created_by
       ) VALUES (?, 1, ?, ?, ?, 'Initial content sync', 'content-sync')`,
    ).bind(file.id, file.content, variablesJson, metadataJson),
    env.DB.prepare(
      `INSERT OR IGNORE INTO prompt_file_versions(
         file_id, version_number, content, variables_json, metadata_json,
         change_note, created_by
       )
       SELECT node_id, current_version + 1, ?, ?, ?, 'Updated by content sync', 'content-sync'
       FROM prompt_files
       WHERE node_id = ? AND content_hash <> ?`,
    ).bind(file.content, variablesJson, metadataJson, file.id, file.contentHash),
    env.DB.prepare(
      `UPDATE prompt_files
       SET title = ?,
           description = ?,
           content = ?,
           language = ?,
           format = ?,
           prompt_role = ?,
           variables_json = ?,
           metadata_json = ?,
           tags_text = ?,
           current_version = current_version + CASE WHEN content_hash <> ? THEN 1 ELSE 0 END,
           updated_at = CASE
             WHEN content_hash <> ? THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
             ELSE updated_at
           END,
           content_hash = ?
       WHERE node_id = ?
         AND (
           title IS NOT ?
           OR description IS NOT ?
           OR content IS NOT ?
           OR language IS NOT ?
           OR format IS NOT ?
           OR prompt_role IS NOT ?
           OR variables_json IS NOT ?
           OR metadata_json IS NOT ?
           OR tags_text IS NOT ?
           OR content_hash IS NOT ?
         )`,
    ).bind(
      file.title,
      file.description,
      file.content,
      file.language,
      file.format,
      file.promptRole,
      variablesJson,
      metadataJson,
      tagsText,
      file.contentHash,
      file.contentHash,
      file.contentHash,
      file.id,
      file.title,
      file.description,
      file.content,
      file.language,
      file.format,
      file.promptRole,
      variablesJson,
      metadataJson,
      tagsText,
      file.contentHash,
    ),
  ];

  for (const tag of tags) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO tags(name, normalized_name)
         VALUES (?, ?)
         ON CONFLICT(normalized_name) DO UPDATE SET name = excluded.name
         WHERE tags.name IS NOT excluded.name`,
      ).bind(tag.display, tag.normalized),
    );
  }

  if (tags.length === 0) {
    statements.push(env.DB.prepare('DELETE FROM file_tags WHERE file_id = ?').bind(file.id));
  } else {
    const placeholders = tags.map(() => '?').join(', ');
    statements.push(
      env.DB.prepare(
        `DELETE FROM file_tags
         WHERE file_id = ?
           AND tag_id NOT IN (
             SELECT id FROM tags WHERE normalized_name IN (${placeholders})
           )`,
      ).bind(file.id, ...tags.map(({ normalized }) => normalized)),
    );
  }

  for (const tag of tags) {
    statements.push(
      env.DB.prepare(
        `INSERT OR IGNORE INTO file_tags(file_id, tag_id)
         SELECT ?, id FROM tags WHERE normalized_name = ?`,
      ).bind(file.id, tag.normalized),
    );
  }

  statements.push(
    upsertSyncEntry(
      env,
      runId,
      'file',
      file.id,
      file.projectId,
      file.sourcePath,
      file.syncHash,
    ),
  );
  return statements;
}

function compareEntry(
  stats: SyncEntityStats,
  entry: SyncEntryRow | undefined,
  sourcePath: string,
  contentHash: string,
): void {
  if (!entry) {
    stats.created += 1;
    return;
  }
  const moved = entry.source_path !== sourcePath;
  const updated = entry.content_hash !== contentHash;
  if (moved) stats.moved += 1;
  if (updated) stats.updated += 1;
  if (!moved && !updated) stats.unchanged += 1;
}

function movedOnlyStatements(
  env: Env,
  runId: string,
  entityType: EntityType,
  entityId: string,
  projectId: string,
  sourcePath: string,
  contentHash: string,
): D1PreparedStatement[] {
  return [
    upsertSyncEntry(env, runId, entityType, entityId, projectId, sourcePath, contentHash),
  ];
}

export class ContentSyncService {
  constructor(private readonly env: Env) {}

  async snapshot(): Promise<{
    entries: Array<{
      syncKey: string;
      entityType: EntityType;
      entityId: string;
      projectId: string;
      sourcePath: string;
      contentHash: string;
      lastSeenRunId: string;
      updatedAt: string;
    }>;
    latestRun: Record<string, unknown> | null;
  }> {
    const [entryRows, latestRun] = await Promise.all([
      this.env.DB.prepare(
        `SELECT sync_key, entity_type, entity_id, project_id, source_path,
                content_hash, last_seen_run_id, updated_at
         FROM content_sync_entries
         ORDER BY project_id, entity_type, source_path`,
      ).all<SyncEntryRow>(),
      this.env.DB.prepare(
        `SELECT id, source, manifest_hash, status, prune_requested, stats_json,
                error_text, started_at, finished_at
         FROM content_sync_runs
         ORDER BY started_at DESC
         LIMIT 1`,
      ).first<RecentRunRow>(),
    ]);

    return {
      entries: entryRows.results.map((row) => ({
        syncKey: row.sync_key,
        entityType: row.entity_type,
        entityId: row.entity_id,
        projectId: row.project_id,
        sourcePath: row.source_path,
        contentHash: row.content_hash,
        lastSeenRunId: row.last_seen_run_id,
        updatedAt: row.updated_at,
      })),
      latestRun: latestRun
        ? {
            id: latestRun.id,
            source: latestRun.source,
            manifestHash: latestRun.manifest_hash,
            status: latestRun.status,
            pruneRequested: latestRun.prune_requested === 1,
            stats: JSON.parse(latestRun.stats_json) as unknown,
            error: latestRun.error_text,
            startedAt: latestRun.started_at,
            finishedAt: latestRun.finished_at,
          }
        : null,
    };
  }

  private async analyze(
    manifest: ContentManifest,
    pruneRequested: boolean,
  ): Promise<ContentSyncAnalysis> {
    validateManifestReferences(manifest);
    const rows = await this.env.DB.prepare(
      `SELECT sync_key, entity_type, entity_id, project_id, source_path,
              content_hash, last_seen_run_id, updated_at
       FROM content_sync_entries`,
    ).all<SyncEntryRow>();
    const existing = new Map(rows.results.map((row) => [row.sync_key, row]));

    const plan: ContentSyncPlan = {
      manifestHash: manifest.manifestHash,
      prune: pruneRequested,
      projects: EMPTY_STATS(),
      folders: EMPTY_STATS(),
      files: EMPTY_STATS(),
      deletions: [],
    };

    const currentKeys = new Set<string>();
    for (const project of manifest.projects) {
      const key = entityKey('project', project.id);
      currentKeys.add(key);
      compareEntry(plan.projects, existing.get(key), project.sourcePath, project.configHash);
    }
    for (const folder of manifest.folders) {
      const key = entityKey('folder', folder.id);
      currentKeys.add(key);
      compareEntry(plan.folders, existing.get(key), folder.sourcePath, folder.configHash);
    }
    for (const file of manifest.files) {
      const key = entityKey('file', file.id);
      currentKeys.add(key);
      compareEntry(plan.files, existing.get(key), file.sourcePath, file.syncHash);
    }

    if (pruneRequested) {
      const pruneProjectIds = new Set(
        manifest.projects.filter((project) => project.prune).map((project) => project.id),
      );
      for (const row of rows.results) {
        if (
          row.entity_type !== 'project' &&
          pruneProjectIds.has(row.project_id) &&
          !currentKeys.has(row.sync_key)
        ) {
          plan.deletions.push({
            syncKey: row.sync_key,
            entityType: row.entity_type,
            entityId: row.entity_id,
            projectId: row.project_id,
            sourcePath: row.source_path,
          });
          if (row.entity_type === 'folder') plan.folders.deleted += 1;
          if (row.entity_type === 'file') plan.files.deleted += 1;
        }
      }
    }

    return { plan, existing };
  }

  async plan(manifest: ContentManifest, pruneRequested: boolean): Promise<ContentSyncPlan> {
    return (await this.analyze(manifest, pruneRequested)).plan;
  }

  async sync(request: ContentSyncRequest): Promise<ContentSyncResult> {
    const { manifest, prune, dryRun } = request;
    const { plan, existing } = await this.analyze(manifest, prune);
    const skipped = !hasContentSyncPlanMutations(plan);
    if (dryRun) return { dryRun: true, runId: null, skipped, plan };

    if (skipped) {
      console.log(
        'content_sync_skipped',
        JSON.stringify({ manifestHash: manifest.manifestHash, reason: 'manifest-already-applied' }),
      );
      return { dryRun: false, runId: null, skipped: true, plan };
    }

    const changedProjects = manifest.projects.filter((project) =>
      contentSyncEntryNeedsUpdate(
        existing.get(entityKey('project', project.id)),
        project.sourcePath,
        project.configHash,
      ),
    );
    const changedFolders = manifest.folders.filter((folder) =>
      contentSyncEntryNeedsUpdate(
        existing.get(entityKey('folder', folder.id)),
        folder.sourcePath,
        folder.configHash,
      ),
    );
    const changedFiles = manifest.files.filter((file) =>
      contentSyncEntryNeedsUpdate(
        existing.get(entityKey('file', file.id)),
        file.sourcePath,
        file.syncHash,
      ),
    );

    const runId = `content-sync-${Date.now()}-${crypto.randomUUID()}`;
    await this.env.DB.prepare(
      `INSERT INTO content_sync_runs(
         id, source, manifest_hash, status, prune_requested, stats_json
       ) VALUES (?, ?, ?, 'running', ?, ?)`,
    )
      .bind(runId, manifest.source, manifest.manifestHash, prune ? 1 : 0, JSON.stringify(plan))
      .run();

    try {
      await executeStatementGroups(
        this.env.DB,
        changedProjects.map((project) => {
          const entry = existing.get(entityKey('project', project.id));
          return entry && entry.content_hash === project.configHash
            ? movedOnlyStatements(
                this.env,
                runId,
                'project',
                project.id,
                project.id,
                project.sourcePath,
                project.configHash,
              )
            : projectStatements(this.env, project, runId);
        }),
      );

      await executeStatementGroups(
        this.env.DB,
        [...changedFolders]
          .sort((left, right) => left.depth - right.depth || left.path.localeCompare(right.path))
          .map((folder) => {
            const entry = existing.get(entityKey('folder', folder.id));
            return entry && entry.content_hash === folder.configHash
              ? movedOnlyStatements(
                  this.env,
                  runId,
                  'folder',
                  folder.id,
                  folder.projectId,
                  folder.sourcePath,
                  folder.configHash,
                )
              : folderStatements(this.env, folder, runId);
          }),
      );

      await executeStatementGroups(
        this.env.DB,
        [...changedFiles]
          .sort((left, right) => left.depth - right.depth || left.path.localeCompare(right.path))
          .map((file) => {
            const entry = existing.get(entityKey('file', file.id));
            return entry && entry.content_hash === file.syncHash
              ? movedOnlyStatements(
                  this.env,
                  runId,
                  'file',
                  file.id,
                  file.projectId,
                  file.sourcePath,
                  file.syncHash,
                )
              : fileStatements(this.env, file, runId);
          }),
      );

      if (plan.deletions.length > 0) {
        const deletionGroups = [...plan.deletions]
          .sort((left, right) => {
            if (left.entityType === right.entityType) {
              return right.sourcePath.length - left.sourcePath.length;
            }
            return left.entityType === 'file' ? -1 : 1;
          })
          .map((entry) => [
            this.env.DB.prepare(
              `UPDATE nodes
               SET deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
                   updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
               WHERE id = ? AND project_id = ? AND deleted_at IS NULL`,
            ).bind(entry.entityId, entry.projectId),
            this.env.DB.prepare('DELETE FROM content_sync_entries WHERE sync_key = ?').bind(
              entry.syncKey,
            ),
          ]);
        await executeStatementGroups(this.env.DB, deletionGroups);
      }

      const completionStatements: D1PreparedStatement[] = [];
      if (changedFiles.length > 0) {
        completionStatements.push(
          this.env.DB.prepare(
            `DELETE FROM tags
             WHERE id NOT IN (SELECT DISTINCT tag_id FROM file_tags)`,
          ),
        );
      }
      completionStatements.push(
        this.env.DB.prepare(
          `UPDATE content_sync_runs
           SET status = 'succeeded',
               stats_json = ?,
               finished_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
           WHERE id = ?`,
        ).bind(JSON.stringify(plan), runId),
      );
      await this.env.DB.batch(completionStatements);

      console.log(
        'content_sync_applied',
        JSON.stringify({
          runId,
          manifestHash: manifest.manifestHash,
          projects: changedProjects.length,
          folders: changedFolders.length,
          files: changedFiles.length,
          deletions: plan.deletions.length,
        }),
      );
      return { dryRun: false, runId, skipped: false, plan };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.env.DB.prepare(
        `UPDATE content_sync_runs
         SET status = 'failed',
             error_text = ?,
             finished_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ?`,
      )
        .bind(message.slice(0, 10_000), runId)
        .run();
      throw error;
    }
  }
}
