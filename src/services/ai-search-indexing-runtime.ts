import type { Env } from '../types';
import {
  aiSearchRetryDelaySeconds,
  clampProcessLimit,
  errorMessage,
  JOB_LEASE_SECONDS,
  MAX_JOB_ATTEMPTS,
} from './ai-search-layout';
import { reconcileAiSearchJobs } from './ai-search-indexing-db';
import {
  cleanupLegacyProjectInstances,
  deleteFile,
  ensureProjectInstance,
  setProjectMappingError,
  upsertFile,
  verifyPendingRemoteItems,
} from './ai-search-indexing-remote';
import type {
  AiSearchIndexStatus,
  AiSearchJobResult,
  AiSearchJobRow,
  AiSearchProcessSummary,
} from './ai-search-indexing-types';

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
  } else if (job.operation === 'upsert_file' && job.file_id) {
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
  const verification = await verifyPendingRemoteItems(env, limit);
  const cleanedInstances = await cleanupLegacyProjectInstances(env, Math.min(limit, 4));
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
    checked: verification.checked,
    indexed: verification.indexed,
    remoteErrors: verification.remoteErrors,
    cleanedInstances,
  };

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
        const failedStatus = await failJob(env, job, error);
        if (failedStatus === 'retry') summary.retried += 1;
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
  const [projects, items, jobs, documentCounts, migrations, recentErrors] = await Promise.all([
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
      `SELECT
         COUNT(document.file_id) AS expected,
         SUM(CASE WHEN item.status = 'indexed' THEN 1 ELSE 0 END) AS indexed,
         SUM(CASE WHEN item.status IN ('queued', 'processing') THEN 1 ELSE 0 END) AS waiting,
         SUM(CASE WHEN item.status = 'error' THEN 1 ELSE 0 END) AS error,
         SUM(CASE WHEN item.file_id IS NULL THEN 1 ELSE 0 END) AS missing
       FROM prompt_search_documents document
       LEFT JOIN ai_search_items item ON item.file_id = document.file_id`,
    ).first<{
      expected: number | string;
      indexed: number | string;
      waiting: number | string;
      error: number | string;
      missing: number | string;
    }>(),
    env.DB.prepare(
      `SELECT COUNT(*) AS count
       FROM ai_search_projects
       WHERE previous_instance_id IS NOT NULL`,
    ).first<{ count: number | string }>(),
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
    documents: {
      expected: Number(documentCounts?.expected ?? 0),
      indexed: Number(documentCounts?.indexed ?? 0),
      waiting: Number(documentCounts?.waiting ?? 0),
      error: Number(documentCounts?.error ?? 0),
      missing: Number(documentCounts?.missing ?? 0),
    },
    migrations: {
      pendingInstanceCleanup: Number(migrations?.count ?? 0),
    },
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

export { reconcileAiSearchJobs };
