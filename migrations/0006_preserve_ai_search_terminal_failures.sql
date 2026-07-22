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

-- Content sync uses soft deletion. If a future maintenance task attempts a hard
-- delete, fail loudly until the remote item or project instance has been
-- removed and its local mapping cleared. This avoids D1 cascades hiding a
-- Cloudflare storage orphan.
CREATE TRIGGER IF NOT EXISTS ai_search_nodes_require_remote_cleanup
BEFORE DELETE ON nodes
WHEN EXISTS (
  SELECT 1 FROM ai_search_items item WHERE item.file_id = old.id
)
BEGIN
  SELECT RAISE(ABORT, 'Remove the AI Search item before hard-deleting this node.');
END;

CREATE TRIGGER IF NOT EXISTS ai_search_projects_require_remote_cleanup
BEFORE DELETE ON projects
WHEN EXISTS (
  SELECT 1 FROM ai_search_projects mapping WHERE mapping.project_id = old.id
)
BEGIN
  SELECT RAISE(ABORT, 'Remove the AI Search instance before hard-deleting this project.');
END;
