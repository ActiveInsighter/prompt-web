import type { Env } from '../types';

export interface RetryFailedAiSearchJobsResult {
  requested: number;
  reset: number;
}

const DEFAULT_RETRY_LIMIT = 20;
const MAX_RETRY_LIMIT = 100;

function clampRetryLimit(limit?: number): number {
  if (!Number.isFinite(limit)) return DEFAULT_RETRY_LIMIT;
  return Math.min(MAX_RETRY_LIMIT, Math.max(1, Math.trunc(limit ?? DEFAULT_RETRY_LIMIT)));
}

/**
 * Explicitly reactivates terminal jobs. Automatic reconciliation deliberately
 * preserves `failed` so permanent errors do not loop forever.
 */
export async function retryFailedAiSearchJobs(
  env: Env,
  requestedLimit?: number,
): Promise<RetryFailedAiSearchJobsResult> {
  const limit = clampRetryLimit(requestedLimit);
  const failed = await env.DB.prepare(
    `SELECT id
     FROM ai_search_jobs
     WHERE status = 'failed'
     ORDER BY updated_at ASC
     LIMIT ?`,
  )
    .bind(limit)
    .all<{ id: string }>();

  if (failed.results.length === 0) return { requested: limit, reset: 0 };
  const placeholders = failed.results.map(() => '?').join(', ');
  const updated = await env.DB.prepare(
    `UPDATE ai_search_jobs
     SET status = 'retry',
         attempts = 0,
         next_attempt_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
         lease_expires_at = NULL,
         last_error = NULL,
         completed_at = NULL,
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id IN (${placeholders})
       AND status = 'failed'`,
  )
    .bind(...failed.results.map((row) => row.id))
    .run();

  return {
    requested: limit,
    reset: Number(updated.meta.changes ?? 0),
  };
}
