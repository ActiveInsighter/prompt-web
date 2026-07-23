import type { Env } from '../types';

type AiSearchJobOperation = 'ensure_instance' | 'upsert_file' | 'delete_file';
type AiSearchJobStatus = 'pending' | 'processing' | 'retry' | 'completed' | 'failed';
type AiSearchJobResult = 'completed' | 'skipped';

interface ProjectRow {
  id: string;
  slug: string;
}

interface ProjectMappingRow {
  project_id: string;
  instance_id: string;
  status: 'pending' | 'ready' | 'error';
}

interface IndexedItemRow {
  file_id: string;
  project_id: string;
  instance_id: string;
  item_id: string;
  item_key: string;
  index_hash: string;
  content_hash: string;
}

interface IndexableFileRow {
  file_id: string;
  project_id: string;
  project_slug: string;
  file_name: string;
  content: string;
  format: 'markdown' | 'text' | 'json';
  visibility: 'public' | 'private';
  content_hash: string;
  file_sync_hash: string;
  project_config_hash: string;
}

interface AiSearchJobRow {
  id: string;
  dedupe_key: string;
  operation: AiSearchJobOperation;
  project_id: string;
  file_id: string | null;
  expected_hash: string;
  status: AiSearchJobStatus;
  attempts: number;
}

export interface AiSearchProcessSummary {
  requested: number;
  claimed: number;
  completed: number;
  retried: number;
  failed: number;
  skipped: number;
}

export interface AiSearchIndexStatus {
  projects: Record<string, number>;
  items: Record<string, number>;
  jobs: Record<string, number>;
  recentErrors: Array<{
    operation: string;
    projectId: string;
    fileId: string | null;
    attempts: number;
    error: string;
    updatedAt: string;
  }>;
}

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_JOB_ATTEMPTS = 5;
const JOB_LEASE_SECONDS = 120;
const DEFAULT_PROCESS_LIMIT = 3;
const MAX_PROCESS_LIMIT = 10;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (isRecord(error) && typeof error.message === 'string') return error.message;
  return String(error);
}

function errorStatus(error: unknown): number | undefined {
  if (!isRecord(error)) return undefined;
  for (const candidate of [error.status, error.statusCode, error.httpStatus, error.responseStatus]) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate;
  }
  return undefined;
}

function isNotFoundError(error: unknown): boolean {
  return errorStatus(error) === 404 || /not[ -]?found|does not exist/iu.test(errorMessage(error));
}

function clampProcessLimit(limit?: number): number {
  if (!Number.isFinite(limit)) return DEFAULT_PROCESS_LIMIT;
  return Math.min(MAX_PROCESS_LIMIT, Math.max(1, Math.trunc(limit ?? DEFAULT_PROCESS_LIMIT)));
}

/** A deterministic, non-cryptographic token used only to keep platform keys short. */
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

export function buildProjectAiSearchInstanceId(projectId: string, slug: string): string {
  const safeSlug =
    slug
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[^a-z0-9_]+/gu, '-')
      .replace(/^-+|-+$/gu, '')
      .slice(0, 42) || 'project';
  const suffix = stableAiSearchToken(projectId).slice(0, 12);
  return `p-${safeSlug}-${suffix}`.slice(0, 64).replace(/-+$/gu, '');
}

export function buildAiSearchItemKey(
  fileId: string,
  contentHash: string,
  format: 'markdown' | 'text' | 'json',
): string {
  const extension = format === 'markdown' ? 'md' : format === 'json' ? 'json' : 'txt';
  const safeStem =
    fileId
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/gu, '-')
      .replace(/^-+|-+$/gu, '')
      .slice(0, 36) || 'document';
  const fileToken = stableAiSearchToken(fileId).slice(0, 10);
  const revision = contentHash.replace(/^sha256:/u, '').replace(/[^a-f0-9]/giu, '').slice(0, 12);
  return `documents/${safeStem}-${fileToken}-${revision || 'content'}.${extension}`;
}

export function buildAiSearchIndexHash(fileSyncHash: string, projectConfigHash: string): string {
  return `${fileSyncHash}|${projectConfigHash}`;
}

export function aiSearchRetryDelaySeconds(attempts: number): number {
  return Math.min(3600, 30 * 2 ** Math.max(0, attempts - 1));
}

function enqueueEnsureStatement(
  env: Env,
  projectId: string,
  projectConfigHash: string,
): D1PreparedStatement {
  const dedupeKey = `ensure:${projectId}:${projectConfigHash || 'current'}`;
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

function enqueueUpsertStatement(
  env: Env,
  projectId: string,
  fileId: string,
  fileSyncHash: string,
  projectConfigHash: string,
): D1PreparedStatement {
  const expectedHash = buildAiSearchIndexHash(fileSyncHash, projectConfigHash);
  const dedupeKey = `upsert:${fileId}:${fileSyncHash}:${projectConfigHash}`;
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
 * Repairs missing jobs and backfills existing D1 content. Dedupe keys and
 * indexed revision hashes make this safe to run on every cron invocation.
 */
export async function reconcileAiSearchJobs(env: Env): Promise<void> {
  // Jobs created by the former uploadAndPoll implementation can be left in
  // terminal failure even though the source file is still current. Reset only
  // that known timeout class; permanent validation failures remain terminal.
  await env.DB.prepare(
    `UPDATE ai_search_jobs
     SET status = 'pending',
         attempts = 0,
         next_attempt_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
         lease_expires_at = NULL,
         last_error = NULL,
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
         completed_at = NULL
     WHERE operation = 'upsert_file'
       AND status = 'failed'
       AND last_error LIKE '%aborted due to timeout%'
       AND EXISTS (
         SELECT 1
         FROM prompt_search_documents document
         WHERE document.file_id = ai_search_jobs.file_id
       )`,
  ).run();

  const [projects, files, obsoleteItems] = await Promise.all([
    env.DB.prepare(
      `SELECT p.id, COALESCE(sync.content_hash, '') AS config_hash
       FROM projects p
       LEFT JOIN content_sync_entries sync
         ON sync.entity_type = 'project' AND sync.entity_id = p.id
       LEFT JOIN ai_search_projects mapping ON mapping.project_id = p.id
       WHERE p.deleted_at IS NULL
         AND (mapping.project_id IS NULL OR mapping.status <> 'ready')`,
    ).all<{ id: string; config_hash: string }>(),
    env.DB.prepare(
      `SELECT d.file_id, d.project_id,
              file_sync.content_hash AS file_sync_hash,
              project_sync.content_hash AS project_config_hash
       FROM prompt_search_documents d
       JOIN content_sync_entries file_sync
         ON file_sync.entity_type = 'file' AND file_sync.entity_id = d.file_id
       JOIN content_sync_entries project_sync
         ON project_sync.entity_type = 'project' AND project_sync.entity_id = d.project_id
       LEFT JOIN ai_search_items item ON item.file_id = d.file_id
       WHERE item.file_id IS NULL
          OR item.status <> 'indexed'
          OR item.index_hash <> file_sync.content_hash || '|' || project_sync.content_hash`,
    ).all<{
      file_id: string;
      project_id: string;
      file_sync_hash: string;
      project_config_hash: string;
    }>(),
    env.DB.prepare(
      `SELECT item.file_id, item.project_id, item.instance_id, item.item_id,
              item.item_key, item.index_hash, item.content_hash
       FROM ai_search_items item
       LEFT JOIN prompt_search_documents document ON document.file_id = item.file_id
       WHERE document.file_id IS NULL`,
    ).all<IndexedItemRow>(),
  ]);

  const statements: D1PreparedStatement[] = [
    ...projects.results.map((project) =>
      enqueueEnsureStatement(env, project.id, project.config_hash),
    ),
    ...files.results.map((file) =>
      enqueueUpsertStatement(
        env,
        file.project_id,
        file.file_id,
        file.file_sync_hash,
        file.project_config_hash,
      ),
    ),
    ...obsoleteItems.results.map((item) => enqueueDeleteStatement(env, item)),
  ];

  for (let offset = 0; offset < statements.length; offset += 80) {
    await env.DB.batch(statements.slice(offset, offset + 80));
  }
}

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

async function setProjectMappingError(
  env: Env,
  projectId: string,
  instanceId: string,
  error: unknown,
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO ai_search_projects(project_id, instance_id, status, last_error, updated_at)
     VALUES (?, ?, 'error', ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
     ON CONFLICT(project_id) DO UPDATE SET
       instance_id = excluded.instance_id,
       status = 'error',
       last_error = excluded.last_error,
       updated_at = excluded.updated_at`,
  )
    .bind(projectId, instanceId, errorMessage(error).slice(0, 4000))
    .run();
}

async function ensureProjectInstance(
  env: Env,
  projectId: string,
): Promise<{ instanceId: string; instance: AiSearchInstance } | null> {
  const project = await loadProject(env, projectId);
  if (!project) return null;

  const existing = await env.DB.prepare(
    `SELECT project_id, instance_id, status
     FROM ai_search_projects
     WHERE project_id = ?
     LIMIT 1`,
  )
    .bind(projectId)
    .first<ProjectMappingRow>();
  const instanceId = existing?.instance_id ?? buildProjectAiSearchInstanceId(project.id, project.slug);

  await env.DB.prepare(
    `INSERT INTO ai_search_projects(project_id, instance_id, status, updated_at)
     VALUES (?, ?, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
     ON CONFLICT(project_id) DO UPDATE SET
       instance_id = excluded.instance_id,
       status = CASE WHEN ai_search_projects.status = 'ready' THEN 'ready' ELSE 'pending' END,
       updated_at = excluded.updated_at`,
  )
    .bind(projectId, instanceId)
    .run();

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
      // A concurrent Worker may have created this deterministic instance after
      // the first lookup. Verify once more before treating creation as failed.
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
     WHERE project_id = ?`,
  )
    .bind(projectId)
    .run();
  return { instanceId, instance };
}

async function loadIndexableFile(env: Env, fileId: string): Promise<IndexableFileRow | null> {
  return env.DB.prepare(
    `SELECT d.file_id, d.project_id, d.project_slug, d.file_name, d.content,
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

async function deleteIndexedItem(instance: AiSearchInstance, itemId: string): Promise<void> {
  try {
    await instance.items.delete(itemId);
  } catch (error) {
    if (!isNotFoundError(error)) throw error;
  }
}

async function upsertFile(env: Env, job: AiSearchJobRow): Promise<AiSearchJobResult> {
  if (!job.file_id) throw new Error('upsert_file job is missing file_id.');
  const file = await loadIndexableFile(env, job.file_id);
  if (!file) return 'skipped';

  const currentIndexHash = buildAiSearchIndexHash(file.file_sync_hash, file.project_config_hash);
  if (job.expected_hash && job.expected_hash !== currentIndexHash) return 'skipped';

  const previous = await env.DB.prepare(
    `SELECT file_id, project_id, instance_id, item_id, item_key, index_hash, content_hash
     FROM ai_search_items
     WHERE file_id = ?
     LIMIT 1`,
  )
    .bind(file.file_id)
    .first<IndexedItemRow>();
  if (previous?.index_hash === currentIndexHash && previous.content_hash === file.content_hash) {
    return 'skipped';
  }

  const uploadBytes = new TextEncoder().encode(file.content).byteLength;
  if (uploadBytes > MAX_UPLOAD_BYTES) {
    throw new RangeError(
      `AI Search item ${file.file_id} is ${uploadBytes} bytes; the maximum is ${MAX_UPLOAD_BYTES}.`,
    );
  }

  const provisioned = await ensureProjectInstance(env, file.project_id);
  if (!provisioned) return 'skipped';
  const itemKey = buildAiSearchItemKey(file.file_id, file.content_hash, file.format);
  // Queue the document and return immediately. AI Search performs parsing,
  // chunking, and embedding asynchronously, so Worker request duration no
  // longer controls whether the document eventually becomes searchable.
  const uploaded = await provisioned.instance.items.upload(itemKey, file.content, {
    metadata: {
      file_id: file.file_id,
      content_hash: file.content_hash,
      visibility: file.visibility,
    },
  });

  if (previous?.item_id && previous.item_id !== uploaded.id) {
    await deleteIndexedItem(env.PROMPT_AI_SEARCH.get(previous.instance_id), previous.item_id);
  }

  await env.DB.prepare(
    `INSERT INTO ai_search_items(
       file_id, project_id, instance_id, item_id, item_key, index_hash,
       content_hash, status, chunks_count, last_error, indexed_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, 'indexed', ?, NULL,
               strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
               strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
     ON CONFLICT(file_id) DO UPDATE SET
       project_id = excluded.project_id,
       instance_id = excluded.instance_id,
       item_id = excluded.item_id,
       item_key = excluded.item_key,
       index_hash = excluded.index_hash,
       content_hash = excluded.content_hash,
       status = 'indexed',
       chunks_count = excluded.chunks_count,
       last_error = NULL,
       indexed_at = excluded.indexed_at,
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
      null,
    )
    .run();
  return 'completed';
}

async function deleteFile(env: Env, job: AiSearchJobRow): Promise<AiSearchJobResult> {
  if (!job.file_id) throw new Error('delete_file job is missing file_id.');
  const active = await env.DB.prepare(
    'SELECT 1 AS active FROM prompt_search_documents WHERE file_id = ? LIMIT 1',
  )
    .bind(job.file_id)
    .first<{ active: number }>();
  if (active) return 'skipped';

  const item = await env.DB.prepare(
    `SELECT file_id, project_id, instance_id, item_id, item_key, index_hash, content_hash
     FROM ai_search_items
     WHERE file_id = ?
     LIMIT 1`,
  )
    .bind(job.file_id)
    .first<IndexedItemRow>();
  if (!item) return 'skipped';
  if (job.expected_hash && job.expected_hash !== item.item_id) return 'skipped';

  await deleteIndexedItem(env.PROMPT_AI_SEARCH.get(item.instance_id), item.item_id);
  await env.DB.prepare('DELETE FROM ai_search_items WHERE file_id = ?').bind(job.file_id).run();
  return 'completed';
}

async function runJob(env: Env, job: AiSearchJobRow): Promise<AiSearchJobResult> {
  if (job.operation === 'ensure_instance') {
    return (await ensureProjectInstance(env, job.project_id)) ? 'completed' : 'skipped';
  }
  if (job.operation === 'upsert_file') return upsertFile(env, job);
  return deleteFile(env, job);
}

async function claimJob(env: Env, job: AiSearchJobRow): Promise<AiSearchJobRow | null> {
  const claimed = await env.DB.prepare(
    `UPDATE ai_search_jobs
     SET status = 'processing',
         attempts = attempts + 1,
         lease_expires_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?),
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = ?
       AND status IN ('pending', 'retry', 'processing')
       AND (lease_expires_at IS NULL OR lease_expires_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
  )
    .bind(`+${JOB_LEASE_SECONDS} seconds`, job.id)
    .run();
  if ((claimed.meta.changes ?? 0) !== 1) return null;
  return { ...job, status: 'processing', attempts: job.attempts + 1 };
}

async function completeJob(env: Env, jobId: string): Promise<void> {
  await env.DB.prepare(
    `UPDATE ai_search_jobs
     SET status = 'completed',
         lease_expires_at = NULL,
         last_error = NULL,
         completed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = ?`,
  )
    .bind(jobId)
    .run();
}

async function failJob(env: Env, job: AiSearchJobRow, error: unknown): Promise<'retry' | 'failed'> {
  const permanentlyFailed = job.attempts >= MAX_JOB_ATTEMPTS || error instanceof RangeError;
  const status = permanentlyFailed ? 'failed' : 'retry';
  const nextAttempt = new Date(
    Date.now() + aiSearchRetryDelaySeconds(job.attempts) * 1000,
  ).toISOString();
  const message = errorMessage(error).slice(0, 4000);

  await env.DB.prepare(
    `UPDATE ai_search_jobs
     SET status = ?,
         next_attempt_at = ?,
         lease_expires_at = NULL,
         last_error = ?,
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = ?`,
  )
    .bind(status, nextAttempt, message, job.id)
    .run();

  if (job.operation === 'ensure_instance') {
    const mapping = await env.DB.prepare(
      'SELECT instance_id FROM ai_search_projects WHERE project_id = ? LIMIT 1',
    )
      .bind(job.project_id)
      .first<{ instance_id: string }>();
    if (mapping) await setProjectMappingError(env, job.project_id, mapping.instance_id, error);
  } else if (job.file_id) {
    await env.DB.prepare(
      `UPDATE ai_search_items
       SET status = 'error', last_error = ?,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE file_id = ?`,
    )
      .bind(message, job.file_id)
      .run();
  }

  console.error('ai_search_job_failed', {
    jobId: job.id,
    operation: job.operation,
    projectId: job.project_id,
    fileId: job.file_id,
    attempts: job.attempts,
    status,
    error,
  });
  return status;
}

export async function processAiSearchJobs(
  env: Env,
  requestedLimit?: number,
): Promise<AiSearchProcessSummary> {
  const limit = clampProcessLimit(requestedLimit);
  const candidates = await env.DB.prepare(
    `SELECT id, dedupe_key, operation, project_id, file_id, expected_hash, status, attempts
     FROM ai_search_jobs
     WHERE status IN ('pending', 'retry', 'processing')
       AND next_attempt_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       AND (lease_expires_at IS NULL OR lease_expires_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
     ORDER BY CASE operation WHEN 'ensure_instance' THEN 0 WHEN 'delete_file' THEN 1 ELSE 2 END,
              created_at ASC
     LIMIT ?`,
  )
    .bind(limit)
    .all<AiSearchJobRow>();

  const summary: AiSearchProcessSummary = {
    requested: limit,
    claimed: 0,
    completed: 0,
    retried: 0,
    failed: 0,
    skipped: 0,
  };

  // Upload calls only enqueue work upstream, so a small bounded concurrent
  // batch quickly drains the D1 outbox without exceeding Worker limits.
  await Promise.all(
    candidates.results.map(async (candidate) => {
      const job = await claimJob(env, candidate);
      if (!job) return;
      summary.claimed += 1;
      try {
        const result = await runJob(env, job);
        await completeJob(env, job.id);
        if (result === 'skipped') summary.skipped += 1;
        else summary.completed += 1;
      } catch (error) {
        const status = await failJob(env, job, error);
        if (status === 'retry') summary.retried += 1;
        else summary.failed += 1;
      }
    }),
  );
  return summary;
}

function countByStatus(
  rows: Array<{ status: string; count: number | string }>,
): Record<string, number> {
  return Object.fromEntries(rows.map((row) => [row.status, Number(row.count)]));
}

export async function getAiSearchIndexStatus(env: Env): Promise<AiSearchIndexStatus> {
  const [projects, items, jobs, recentErrors] = await Promise.all([
    env.DB.prepare(
      'SELECT status, COUNT(*) AS count FROM ai_search_projects GROUP BY status',
    ).all<{ status: string; count: number | string }>(),
    env.DB.prepare(
      'SELECT status, COUNT(*) AS count FROM ai_search_items GROUP BY status',
    ).all<{ status: string; count: number | string }>(),
    env.DB.prepare(
      'SELECT status, COUNT(*) AS count FROM ai_search_jobs GROUP BY status',
    ).all<{ status: string; count: number | string }>(),
    env.DB.prepare(
      `SELECT operation, project_id, file_id, attempts, last_error, updated_at
       FROM ai_search_jobs
       WHERE last_error IS NOT NULL
       ORDER BY updated_at DESC
       LIMIT 20`,
    ).all<{
      operation: string;
      project_id: string;
      file_id: string | null;
      attempts: number;
      last_error: string;
      updated_at: string;
    }>(),
  ]);

  return {
    projects: countByStatus(projects.results),
    items: countByStatus(items.results),
    jobs: countByStatus(jobs.results),
    recentErrors: recentErrors.results.map((row) => ({
      operation: row.operation,
      projectId: row.project_id,
      fileId: row.file_id,
      attempts: Number(row.attempts),
      error: row.last_error,
      updatedAt: row.updated_at,
    })),
  };
}
