-- The former uploadAndPoll implementation could leave otherwise valid jobs in
-- a terminal failed state after the Worker-side polling timeout elapsed.
-- This migration runs once against the remote primary D1 database. The current
-- uploader only queues items asynchronously, so these jobs can safely retry.
UPDATE ai_search_jobs
SET status = 'pending',
    attempts = 0,
    next_attempt_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    lease_expires_at = NULL,
    last_error = NULL,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    completed_at = NULL
WHERE status = 'failed';
