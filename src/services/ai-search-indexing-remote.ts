import type { Env } from '../types';
import {
  buildAiSearchIndexHash,
  buildAiSearchItemKey,
  buildProjectAiSearchInstanceId,
  errorMessage,
  isNotFoundError,
  MAX_UPLOAD_BYTES,
} from './ai-search-layout';
import {
  enqueueUpsertStatement,
  loadIndexableFile,
  loadIndexedItem,
} from './ai-search-indexing-db';
import type {
  AiSearchJobResult,
  AiSearchJobRow,
  PendingRemoteItemRow,
  ProjectMappingRow,
  ProjectRow,
  RemoteItemStatus,
} from './ai-search-indexing-types';

async function loadProject(env: Env, projectId: string): Promise<ProjectRow | null> {
  return env.DB.prepare(
    `SELECT id, slug
     FROM projects
     WHERE id = ? AND deleted_at IS NULL
     LIMIT 1`,
  )
    .bind(projectId)
    .first<ProjectRow>();
}

export async function setProjectMappingError(
  env: Env,
  projectId: string,
  instanceId: string,
  error: unknown,
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO ai_search_projects(
       project_id, instance_id, previous_instance_id, status, last_error, updated_at
     ) VALUES (?, ?, NULL, 'error', ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
     ON CONFLICT(project_id) DO UPDATE SET
       instance_id = excluded.instance_id,
       status = 'error',
       last_error = excluded.last_error,
       updated_at = excluded.updated_at`,
  )
    .bind(projectId, instanceId, errorMessage(error).slice(0, 4000))
    .run();
}

export async function ensureProjectInstance(
  env: Env,
  projectId: string,
): Promise<{ instanceId: string; instance: AiSearchInstance } | null> {
  const project = await loadProject(env, projectId);
  if (!project) return null;

  const existing = await env.DB.prepare(
    `SELECT project_id, instance_id, previous_instance_id, status
     FROM ai_search_projects
     WHERE project_id = ?
     LIMIT 1`,
  )
    .bind(projectId)
    .first<ProjectMappingRow>();
  const instanceId = buildProjectAiSearchInstanceId(project.slug);
  const previousInstanceId =
    existing && existing.instance_id !== instanceId
      ? existing.previous_instance_id ?? existing.instance_id
      : existing?.previous_instance_id ?? null;

  if (existing) {
    await env.DB.prepare(
      `UPDATE ai_search_projects
       SET instance_id = ?,
           previous_instance_id = ?,
           status = CASE
             WHEN instance_id = ? AND status = 'ready' THEN 'ready'
             ELSE 'pending'
           END,
           last_error = NULL,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE project_id = ?`,
    )
      .bind(instanceId, previousInstanceId, instanceId, projectId)
      .run();
  } else {
    await env.DB.prepare(
      `INSERT INTO ai_search_projects(
         project_id, instance_id, previous_instance_id, status, updated_at
       ) VALUES (?, ?, NULL, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
    )
      .bind(projectId, instanceId)
      .run();
  }

  let instance = env.PROMPT_AI_SEARCH.get(instanceId);
  try {
    await instance.info();
  } catch (lookupError) {
    try {
      instance = await env.PROMPT_AI_SEARCH.create({
        id: instanceId,
        index_method: { vector: true, keyword: true },
        custom_metadata: [
          { field_name: 'file_id', data_type: 'text' },
          { field_name: 'content_hash', data_type: 'text' },
          { field_name: 'visibility', data_type: 'text' },
        ],
      });
    } catch (createError) {
      instance = env.PROMPT_AI_SEARCH.get(instanceId);
      try {
        await instance.info();
      } catch {
        await setProjectMappingError(env, projectId, instanceId, createError);
        throw createError instanceof Error ? createError : lookupError;
      }
    }
  }

  await env.DB.prepare(
    `UPDATE ai_search_projects
     SET status = 'ready',
         last_error = NULL,
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE project_id = ? AND instance_id = ?`,
  )
    .bind(projectId, instanceId)
    .run();
  return { instanceId, instance };
}

export async function deleteIndexedItem(
  instance: AiSearchInstance,
  itemId: string,
): Promise<void> {
  try {
    await instance.items.delete(itemId);
  } catch (error) {
    if (!isNotFoundError(error)) throw error;
  }
}

export async function upsertFile(
  env: Env,
  job: AiSearchJobRow,
): Promise<AiSearchJobResult> {
  if (!job.file_id) throw new Error('upsert_file job is missing file_id.');
  const file = await loadIndexableFile(env, job.file_id);
  if (!file) return 'skipped';

  const currentIndexHash = buildAiSearchIndexHash(file.file_sync_hash, file.project_config_hash);
  if (job.expected_hash && job.expected_hash !== currentIndexHash) return 'skipped';

  const desiredInstanceId = buildProjectAiSearchInstanceId(file.project_slug);
  const itemKey = buildAiSearchItemKey(file.path);
  const previous = await loadIndexedItem(env, file.file_id);
  if (
    previous?.status === 'indexed' &&
    previous.index_hash === currentIndexHash &&
    previous.content_hash === file.content_hash &&
    previous.instance_id === desiredInstanceId &&
    previous.item_key === itemKey
  ) {
    return 'skipped';
  }

  const uploadBytes = new TextEncoder().encode(file.content).byteLength;
  if (uploadBytes > MAX_UPLOAD_BYTES) {
    throw new RangeError(
      `AI Search item ${file.path} is ${uploadBytes} bytes; the maximum is ${MAX_UPLOAD_BYTES}.`,
    );
  }

  const provisioned = await ensureProjectInstance(env, file.project_id);
  if (!provisioned) return 'skipped';

  let previousInstanceId = previous?.previous_instance_id ?? null;
  let previousItemId = previous?.previous_item_id ?? null;
  if (previous?.status === 'indexed') {
    previousInstanceId = previous.instance_id;
    previousItemId = previous.item_id;
  } else if (previous?.item_id && previous.item_id !== previousItemId) {
    await deleteIndexedItem(env.PROMPT_AI_SEARCH.get(previous.instance_id), previous.item_id);
  }

  const uploaded = await provisioned.instance.items.upload(itemKey, file.content, {
    metadata: {
      file_id: file.file_id,
      content_hash: file.content_hash,
      visibility: file.visibility,
    },
  });

  // Uploading the same readable key may update an item in place. Never retain
  // that same remote item as its own predecessor, or completion cleanup would
  // delete the newly indexed document.
  if (
    previousInstanceId === provisioned.instanceId &&
    previousItemId === uploaded.id
  ) {
    previousInstanceId = null;
    previousItemId = null;
  }

  await env.DB.prepare(
    `INSERT INTO ai_search_items(
       file_id, project_id, instance_id, item_id, item_key, index_hash,
       content_hash, status, chunks_count, last_error, indexed_at, checked_at,
       previous_instance_id, previous_item_id, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, 'queued', NULL, NULL, NULL, NULL, ?, ?,
               strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
     ON CONFLICT(file_id) DO UPDATE SET
       project_id = excluded.project_id,
       instance_id = excluded.instance_id,
       item_id = excluded.item_id,
       item_key = excluded.item_key,
       index_hash = excluded.index_hash,
       content_hash = excluded.content_hash,
       status = 'queued',
       chunks_count = NULL,
       last_error = NULL,
       indexed_at = NULL,
       checked_at = NULL,
       previous_instance_id = excluded.previous_instance_id,
       previous_item_id = excluded.previous_item_id,
       updated_at = excluded.updated_at`,
  )
    .bind(
      file.file_id,
      file.project_id,
      provisioned.instanceId,
      uploaded.id,
      uploaded.key || itemKey,
      currentIndexHash,
      file.content_hash,
      previousInstanceId,
      previousItemId,
    )
    .run();
  return 'completed';
}

export async function deleteFile(
  env: Env,
  job: AiSearchJobRow,
): Promise<AiSearchJobResult> {
  if (!job.file_id) throw new Error('delete_file job is missing file_id.');
  const active = await env.DB.prepare(
    'SELECT 1 AS active FROM prompt_search_documents WHERE file_id = ? LIMIT 1',
  )
    .bind(job.file_id)
    .first<{ active: number }>();
  if (active) return 'skipped';

  const item = await loadIndexedItem(env, job.file_id);
  if (!item) return 'skipped';
  if (job.expected_hash && job.expected_hash !== item.item_id) return 'skipped';

  await deleteIndexedItem(env.PROMPT_AI_SEARCH.get(item.instance_id), item.item_id);
  if (
    item.previous_instance_id &&
    item.previous_item_id &&
    (item.previous_instance_id !== item.instance_id || item.previous_item_id !== item.item_id)
  ) {
    await deleteIndexedItem(
      env.PROMPT_AI_SEARCH.get(item.previous_instance_id),
      item.previous_item_id,
    );
  }
  await env.DB.prepare('DELETE FROM ai_search_items WHERE file_id = ?').bind(job.file_id).run();
  return 'completed';
}

function normalizeRemoteItemStatus(value: unknown): RemoteItemStatus | null {
  if (
    value === 'queued' ||
    value === 'running' ||
    value === 'completed' ||
    value === 'error' ||
    value === 'skipped' ||
    value === 'outdated'
  ) {
    return value;
  }
  return null;
}

async function requeueFile(env: Env, fileId: string): Promise<void> {
  const file = await loadIndexableFile(env, fileId);
  if (!file) return;
  await enqueueUpsertStatement(
    env,
    file.project_id,
    file.file_id,
    file.file_sync_hash,
    file.project_config_hash,
  ).run();
}

export async function verifyPendingRemoteItems(
  env: Env,
  limit: number,
): Promise<{ checked: number; indexed: number; remoteErrors: number }> {
  const pending = await env.DB.prepare(
    `SELECT file_id, project_id, instance_id, item_id, item_key, index_hash,
            content_hash, status, chunks_count, previous_instance_id,
            previous_item_id, checked_at, created_at
     FROM ai_search_items
     WHERE status IN ('queued', 'processing')
     ORDER BY COALESCE(checked_at, created_at) ASC
     LIMIT ?`,
  )
    .bind(limit)
    .all<PendingRemoteItemRow>();

  const result = { checked: 0, indexed: 0, remoteErrors: 0 };
  await Promise.all(
    pending.results.map(async (item) => {
      result.checked += 1;
      try {
        const info = await env.PROMPT_AI_SEARCH.get(item.instance_id).items.get(item.item_id).info();
        const remoteStatus = normalizeRemoteItemStatus(info.status);
        const chunksCount = typeof info.chunks_count === 'number' ? info.chunks_count : null;

        if (remoteStatus === 'completed') {
          if (
            item.previous_instance_id &&
            item.previous_item_id &&
            (item.previous_instance_id !== item.instance_id ||
              item.previous_item_id !== item.item_id)
          ) {
            await deleteIndexedItem(
              env.PROMPT_AI_SEARCH.get(item.previous_instance_id),
              item.previous_item_id,
            );
          }
          await env.DB.prepare(
            `UPDATE ai_search_items
             SET status = 'indexed',
                 chunks_count = ?,
                 last_error = NULL,
                 indexed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
                 checked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
                 previous_instance_id = NULL,
                 previous_item_id = NULL,
                 updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
             WHERE file_id = ? AND item_id = ?`,
          )
            .bind(chunksCount, item.file_id, item.item_id)
            .run();
          result.indexed += 1;
          return;
        }

        if (remoteStatus === 'error' || remoteStatus === 'skipped' || remoteStatus === 'outdated') {
          const message = `Cloudflare AI Search item ended with remote status: ${remoteStatus}`;
          await env.DB.prepare(
            `UPDATE ai_search_items
             SET status = 'error',
                 chunks_count = ?,
                 last_error = ?,
                 checked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
                 updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
             WHERE file_id = ? AND item_id = ?`,
          )
            .bind(chunksCount, message, item.file_id, item.item_id)
            .run();
          await requeueFile(env, item.file_id);
          result.remoteErrors += 1;
          return;
        }

        await env.DB.prepare(
          `UPDATE ai_search_items
           SET status = ?,
               chunks_count = ?,
               checked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
               updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
           WHERE file_id = ? AND item_id = ?`,
        )
          .bind(remoteStatus === 'queued' ? 'queued' : 'processing', chunksCount, item.file_id, item.item_id)
          .run();
      } catch (error) {
        const message = `Could not verify Cloudflare AI Search item: ${errorMessage(error)}`.slice(0, 4000);
        await env.DB.prepare(
          `UPDATE ai_search_items
           SET status = 'error',
               last_error = ?,
               checked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
               updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
           WHERE file_id = ? AND item_id = ?`,
        )
          .bind(message, item.file_id, item.item_id)
          .run();
        await requeueFile(env, item.file_id);
        result.remoteErrors += 1;
      }
    }),
  );
  return result;
}

export async function cleanupLegacyProjectInstances(env: Env, limit: number): Promise<number> {
  const migrations = await env.DB.prepare(
    `SELECT project_id, instance_id, previous_instance_id
     FROM ai_search_projects
     WHERE previous_instance_id IS NOT NULL
     ORDER BY updated_at ASC
     LIMIT ?`,
  )
    .bind(limit)
    .all<{ project_id: string; instance_id: string; previous_instance_id: string }>();

  let cleaned = 0;
  for (const migration of migrations.results) {
    if (migration.previous_instance_id === migration.instance_id) {
      await env.DB.prepare(
        `UPDATE ai_search_projects
         SET previous_instance_id = NULL,
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE project_id = ?`,
      )
        .bind(migration.project_id)
        .run();
      continue;
    }

    const incomplete = await env.DB.prepare(
      `SELECT COUNT(*) AS count
       FROM prompt_search_documents document
       LEFT JOIN ai_search_items item ON item.file_id = document.file_id
       WHERE document.project_id = ?
         AND (
           item.file_id IS NULL OR
           item.instance_id <> ? OR
           item.status <> 'indexed'
         )`,
    )
      .bind(migration.project_id, migration.instance_id)
      .first<{ count: number | string }>();
    const activeJobs = await env.DB.prepare(
      `SELECT COUNT(*) AS count
       FROM ai_search_jobs
       WHERE project_id = ?
         AND status IN ('pending', 'processing', 'retry')`,
    )
      .bind(migration.project_id)
      .first<{ count: number | string }>();

    if (Number(incomplete?.count ?? 0) > 0 || Number(activeJobs?.count ?? 0) > 0) continue;

    try {
      await env.PROMPT_AI_SEARCH.delete(migration.previous_instance_id);
    } catch (error) {
      if (!isNotFoundError(error)) throw error;
    }
    await env.DB.prepare(
      `UPDATE ai_search_projects
       SET previous_instance_id = NULL,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE project_id = ? AND previous_instance_id = ?`,
    )
      .bind(migration.project_id, migration.previous_instance_id)
      .run();
    cleaned += 1;
  }
  return cleaned;
}
