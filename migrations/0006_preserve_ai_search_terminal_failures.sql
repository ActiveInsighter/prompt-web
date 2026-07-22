PRAGMA foreign_keys = ON;

-- Reconciliation may rediscover a stale revision on every scheduled run. A
-- terminal failure must remain terminal for that exact dedupe key; otherwise
-- permanent errors such as an oversized source file would retry forever.
-- Administrators can explicitly move a failed job to `retry`, which is not
-- blocked by this trigger.
CREATE TRIGGER IF NOT EXISTS ai_search_jobs_preserve_terminal_failure
BEFORE UPDATE OF status ON ai_search_jobs
WHEN old.status = 'failed' AND new.status = 'pending'
BEGIN
  SELECT RAISE(IGNORE);
END;
