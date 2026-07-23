import type { Env } from '../types';
import {
  buildAiSearchIndexHash,
  buildAiSearchItemKey,
  buildProjectAiSearchInstanceId,
  READABLE_LAYOUT_VERSION,
} from './ai-search-layout';
import type {
  IndexedItemRow,
  IndexableFileRow,
  ReconcileFileRow,
  ReconcileProjectRow,
} from './ai-search-indexing-types';

export function enqueueEnsureStatement(
  env: Env,
  projectId: string,
  projectSlug: string,
  projectConfigHash: string,
): D1PreparedStatement {
  const instanceId = buildProjectAiSearchInstanceId(projectSlug);
  const dedupeKey = `ensure:${projectId}:${projectConfigHash || 'current'}:${READABLE_LAYOUT_VERSION}:${instanceId}`;
  return env.DB.prepare(
    `INSERT INTO ai_search_jobs(
       id, dedupe_key, operation, project_id, expected_hash
     ) VALUES (?, ?, 'ensure_instance', ?, ?)
     ON CONFLICT(dedupe_key) DO UPDATE SET
       status = 'pending',
       attempts = 0,
       next_attempt_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
       lease_expires_at = NULL,
       last_error = NULL,
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
       completed_at = NULL
     WHERE ai_search_jobs.status IN ('completed', 'failed')`,
  ).bind(`ai-job-${crypto.randomUUID()}`, dedupeKey, projectId, projectConfigHash);
}

export function enqueueUpsertStatement(
  env: Env,
  projectId: string,
  fileId: string,
  fileSyncHash: string,
  projectConfigHash: string,
): D1PreparedStatement {
  const expectedHash = buildAiSearchIndexHash(fileSyncHash, projectConfigHash);
  const dedupeKey = `upsert:${fileId}:${fileSyncHash}:${projectConfigHash}:${READABLE_LAYOUT_VERSION}`;
  return env.DB.prepare(
    `INSERT INTO ai_search_jobs(
       id, dedupe_key, operation, project_id, file_id, expected_hash
     ) VALUES (?, ?, 'upsert_file', ?, ?, ?)
     ON CONFLICT(dedupe_key) DO UPDATE SET
       status = 'pending',
       attempts = 0,
       next_attempt_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
       lease_expires_at = NULL,
       last_error = NULL,
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
       completed_at = NULL
     WHERE ai_search_jobs.status IN ('completed', 'failed')`,
  ).bind(`ai-job-${crypto.randomUUID()}`, dedupeKey, projectId, fileId, expectedHash);
}

function enqueueDeleteStatement(env: Env, item: IndexedItemRow): D1PreparedStatement {
  const dedupeKey = `delete:${item.file_id}:${item.item_id}`;
  return env.DB.prepare(
    `INSERT INTO ai_search_jobs(
       id, dedupe_key, operation, project_id, file_id, expected_hash
     ) VALUES (?, ?, 'delete_file', ?, ?, ?)
     ON CONFLICT(dedupe_key) DO UPDATE SET
       status = 'pending',
       attempts = 0,
       next_attempt_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
       lease_expires_at = NULL,
       last_error = NULL,
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
       completed_at = NULL
     WHERE ai_search_jobs.status IN ('completed', 'failed')`,
  ).bind(
    `ai-job-${crypto.randomUUID()}`,
    dedupeKey,
    item.project_id,
    item.file_id,
    item.item_id,
  );
}

/**
 * Repairs missing jobs, migrates legacy hashed names to readable names, and
 * backfills existing D1 content. This is safe on every cron invocation.
 */
export async function reconcileAiSearchJobs(env: Env): Promise<number> {
  const failedUpserts = await env.DB.prepare(
    `SELECT id, last_error
     FROM ai_search_jobs
     WHERE operation = 'upsert_file' AND status = 'failed'`,
  ).all<{ id: string; last_error: string | null }>();
  const recoverableTimeoutJobs = failedUpserts.results.filter((job) =>
    (job.last_error ?? '').toLowerCase().includes('timeout'),
  );
  for (let offset = 0; offset < recoverableTimeoutJobs.length; offset += 80) {
    await env.DB.batch(
      recoverableTimeoutJobs.slice(offset, offset + 80).map((job) =>
        env.DB.prepare(
          `UPDATE ai_search_jobs
           SET status = 'retry',
               attempts = 0,
               next_attempt_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
               lease_expires_at = NULL,
               last_error = NULL,
               updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
               completed_at = NULL
           WHERE id = ? AND status = 'failed'`,
        ).bind(job.id),
      ),
    );
  }

  const [projects, files, obsoleteItems] = await Promise.all([
    env.DB.prepare(
      `SELECT p.id, p.slug, COALESCE(sync.content_hash, '') AS config_hash,
              mapping.instance_id AS mapped_instance_id,
              mapping.status AS mapping_status
       FROM projects p
       LEFT JOIN content_sync_entries sync
         ON sync.entity_type = 'project' AND sync.entity_id = p.id
       LEFT JOIN ai_search_projects mapping ON mapping.project_id = p.id
       WHERE p.deleted_at IS NULL`,
    ).all<ReconcileProjectRow>(),
    env.DB.prepare(
      `SELECT d.file_id, d.project_id, d.project_slug, d.path,
              file_sync.content_hash AS file_sync_hash,
              project_sync.content_hash AS project_config_hash,
              item.item_id,
              item.instance_id AS item_instance_id,
              item.item_key,
              item.index_hash AS item_index_hash,
              item.status AS item_status
       FROM prompt_search_documents d
       JOIN content_sync_entries file_sync
         ON file_sync.entity_type = 'file' AND file_sync.entity_id = d.file_id
       JOIN content_sync_entries project_sync
         ON project_sync.entity_type = 'project' AND project_sync.entity_id = d.project_id
       LEFT JOIN ai_search_items item ON item.file_id = d.file_id`,
    ).all<ReconcileFileRow>(),
    env.DB.prepare(
      `SELECT item.file_id, item.project_id, item.instance_id, item.item_id,
              item.item_key, item.index_hash, item.content_hash, item.status,
              item.chunks_count, item.previous_instance_id, item.previous_item_id
       FROM ai_search_items item
       LEFT JOIN prompt_search_documents document ON document.file_id = item.file_id
       WHERE document.file_id IS NULL`,
    ).all<IndexedItemRow>(),
  ]);

  const statements: D1PreparedStatement[] = [];
  for (const project of projects.results) {
    const desiredInstanceId = buildProjectAiSearchInstanceId(project.slug);
    if (project.mapped_instance_id !== desiredInstanceId || project.mapping_status !== 'ready') {
      statements.push(enqueueEnsureStatement(env, project.id, project.slug, project.config_hash));
    }
  }

  for (const file of files.results) {
    const desiredInstanceId = buildProjectAiSearchInstanceId(file.project_slug);
    const desiredItemKey = buildAiSearchItemKey(file.path);
    const desiredIndexHash = buildAiSearchIndexHash(
      file.file_sync_hash,
      file.project_config_hash,
    );
    if (
      !file.item_id ||
      file.item_status === 'error' ||
      file.item_instance_id !== desiredInstanceId ||
      file.item_key !== desiredItemKey ||
      file.item_index_hash !== desiredIndexHash
    ) {
      statements.push(
        enqueueUpsertStatement(
          env,
          file.project_id,
          file.file_id,
          file.file_sync_hash,
          file.project_config_hash,
        ),
      );
    }
  }

  statements.push(...obsoleteItems.results.map((item) => enqueueDeleteStatement(env, item)));
  for (let offset = 0; offset < statements.length; offset += 80) {
    await env.DB.batch(statements.slice(offset, offset + 80));
  }
  return recoverableTimeoutJobs.length;
}

export async function loadIndexableFile(
  env: Env,
  fileId: string,
): Promise<IndexableFileRow | null> {
  return env.DB.prepare(
    `SELECT d.file_id, d.project_id, d.project_slug, d.path, d.file_name, d.content,
            d.format, d.visibility, pf.content_hash,
            file_sync.content_hash AS file_sync_hash,
            project_sync.content_hash AS project_config_hash
     FROM prompt_search_documents d
     JOIN prompt_files pf ON pf.node_id = d.file_id
     JOIN content_sync_entries file_sync
       ON file_sync.entity_type = 'file' AND file_sync.entity_id = d.file_id
     JOIN content_sync_entries project_sync
       ON project_sync.entity_type = 'project' AND project_sync.entity_id = d.project_id
     WHERE d.file_id = ?
     LIMIT 1`,
  )
    .bind(fileId)
    .first<IndexableFileRow>();
}

export async function loadIndexedItem(
  env: Env,
  fileId: string,
): Promise<IndexedItemRow | null> {
  return env.DB.prepare(
    `SELECT file_id, project_id, instance_id, item_id, item_key, index_hash,
            content_hash, status, chunks_count, previous_instance_id, previous_item_id
     FROM ai_search_items
     WHERE file_id = ?
     LIMIT 1`,
  )
    .bind(fileId)
    .first<IndexedItemRow>();
}
