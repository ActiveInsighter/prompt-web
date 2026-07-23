-- Two jobs created by earlier AI Search implementations were left terminal
-- after transient upstream failures. The terminal-failure trigger permits an
-- explicit failed -> retry transition while continuing to protect permanent
-- validation failures such as oversized source files.
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
  AND (
    lower(COALESCE(last_error, '')) = 'unable_to_connect_to_ai_search'
    OR lower(COALESCE(last_error, '')) LIKE 'ai search indexing returned error%'
  );
