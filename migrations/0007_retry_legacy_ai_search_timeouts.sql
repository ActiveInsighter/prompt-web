-- The terminal-failure trigger intentionally blocks failed -> pending so that
-- permanent validation errors cannot be rediscovered and retried forever.
-- Administrators are explicitly allowed to move selected failures to retry.
-- Recover only jobs produced by the removed uploadAndPoll timeout path.
UPDATE ai_search_jobs
SET status = 'retry',
    attempts = 0,
    next_attempt_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    lease_expires_at = NULL,
    last_error = NULL,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    completed_at = NULL
WHERE operation = 'upsert_file'
  AND status = 'failed'
  AND instr(lower(COALESCE(last_error, '')), 'timeout') > 0;
