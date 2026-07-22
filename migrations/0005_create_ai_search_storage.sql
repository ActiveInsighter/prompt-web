PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ai_search_projects (
  project_id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'ready', 'error')),
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_search_projects_status
  ON ai_search_projects (status, updated_at);

CREATE TABLE IF NOT EXISTS ai_search_items (
  file_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  instance_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_key TEXT NOT NULL,
  index_hash TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'indexed'
    CHECK (status IN ('indexed', 'error')),
  chunks_count INTEGER,
  last_error TEXT,
  indexed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (file_id) REFERENCES nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_search_items_project
  ON ai_search_items (project_id, status, updated_at);
CREATE INDEX IF NOT EXISTS idx_ai_search_items_instance
  ON ai_search_items (instance_id, status);

CREATE TABLE IF NOT EXISTS ai_search_jobs (
  id TEXT PRIMARY KEY,
  dedupe_key TEXT NOT NULL UNIQUE,
  operation TEXT NOT NULL
    CHECK (operation IN ('ensure_instance', 'upsert_file', 'delete_file')),
  project_id TEXT NOT NULL,
  file_id TEXT,
  expected_hash TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'retry', 'completed', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  lease_expires_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  completed_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (file_id) REFERENCES nodes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_search_jobs_ready
  ON ai_search_jobs (status, next_attempt_at, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_search_jobs_project
  ON ai_search_jobs (project_id, status, created_at);

-- The content synchronization ledger is written in the same D1 transaction batch
-- as project and file data. These triggers implement a transactional outbox: once
-- D1 accepts a revision, the matching AI Search operation cannot be lost.
CREATE TRIGGER IF NOT EXISTS content_sync_entries_ai_project_insert
AFTER INSERT ON content_sync_entries
WHEN new.entity_type = 'project'
BEGIN
  INSERT OR IGNORE INTO ai_search_jobs(
    id, dedupe_key, operation, project_id, expected_hash
  ) VALUES (
    'ai-job-' || lower(hex(randomblob(16))),
    'ensure:' || new.project_id || ':' || new.content_hash,
    'ensure_instance',
    new.project_id,
    new.content_hash
  );

  INSERT OR IGNORE INTO ai_search_jobs(
    id, dedupe_key, operation, project_id, file_id, expected_hash
  )
  SELECT
    'ai-job-' || lower(hex(randomblob(16))),
    'upsert:' || file_sync.entity_id || ':' || file_sync.content_hash || ':' || new.content_hash,
    'upsert_file',
    new.project_id,
    file_sync.entity_id,
    file_sync.content_hash || '|' || new.content_hash
  FROM content_sync_entries file_sync
  JOIN nodes n ON n.id = file_sync.entity_id
  WHERE file_sync.entity_type = 'file'
    AND file_sync.project_id = new.project_id
    AND n.node_type = 'file'
    AND n.deleted_at IS NULL;
END;

CREATE TRIGGER IF NOT EXISTS content_sync_entries_ai_project_update
AFTER UPDATE OF content_hash ON content_sync_entries
WHEN new.entity_type = 'project' AND new.content_hash IS NOT old.content_hash
BEGIN
  INSERT OR IGNORE INTO ai_search_jobs(
    id, dedupe_key, operation, project_id, expected_hash
  ) VALUES (
    'ai-job-' || lower(hex(randomblob(16))),
    'ensure:' || new.project_id || ':' || new.content_hash,
    'ensure_instance',
    new.project_id,
    new.content_hash
  );

  INSERT OR IGNORE INTO ai_search_jobs(
    id, dedupe_key, operation, project_id, file_id, expected_hash
  )
  SELECT
    'ai-job-' || lower(hex(randomblob(16))),
    'upsert:' || file_sync.entity_id || ':' || file_sync.content_hash || ':' || new.content_hash,
    'upsert_file',
    new.project_id,
    file_sync.entity_id,
    file_sync.content_hash || '|' || new.content_hash
  FROM content_sync_entries file_sync
  JOIN nodes n ON n.id = file_sync.entity_id
  WHERE file_sync.entity_type = 'file'
    AND file_sync.project_id = new.project_id
    AND n.node_type = 'file'
    AND n.deleted_at IS NULL;
END;

CREATE TRIGGER IF NOT EXISTS content_sync_entries_ai_file_insert
AFTER INSERT ON content_sync_entries
WHEN new.entity_type = 'file'
BEGIN
  INSERT OR IGNORE INTO ai_search_jobs(
    id, dedupe_key, operation, project_id, file_id, expected_hash
  )
  SELECT
    'ai-job-' || lower(hex(randomblob(16))),
    'upsert:' || new.entity_id || ':' || new.content_hash || ':' || project_sync.content_hash,
    'upsert_file',
    new.project_id,
    new.entity_id,
    new.content_hash || '|' || project_sync.content_hash
  FROM content_sync_entries project_sync
  JOIN nodes n ON n.id = new.entity_id
  WHERE project_sync.entity_type = 'project'
    AND project_sync.entity_id = new.project_id
    AND n.node_type = 'file'
    AND n.deleted_at IS NULL;
END;

CREATE TRIGGER IF NOT EXISTS content_sync_entries_ai_file_update
AFTER UPDATE OF content_hash ON content_sync_entries
WHEN new.entity_type = 'file' AND new.content_hash IS NOT old.content_hash
BEGIN
  INSERT OR IGNORE INTO ai_search_jobs(
    id, dedupe_key, operation, project_id, file_id, expected_hash
  )
  SELECT
    'ai-job-' || lower(hex(randomblob(16))),
    'upsert:' || new.entity_id || ':' || new.content_hash || ':' || project_sync.content_hash,
    'upsert_file',
    new.project_id,
    new.entity_id,
    new.content_hash || '|' || project_sync.content_hash
  FROM content_sync_entries project_sync
  JOIN nodes n ON n.id = new.entity_id
  WHERE project_sync.entity_type = 'project'
    AND project_sync.entity_id = new.project_id
    AND n.node_type = 'file'
    AND n.deleted_at IS NULL;
END;

CREATE TRIGGER IF NOT EXISTS content_sync_entries_ai_file_delete
AFTER DELETE ON content_sync_entries
WHEN old.entity_type = 'file'
BEGIN
  INSERT OR IGNORE INTO ai_search_jobs(
    id, dedupe_key, operation, project_id, file_id, expected_hash
  )
  SELECT
    'ai-job-' || lower(hex(randomblob(16))),
    'delete:' || item.file_id || ':' || item.item_id,
    'delete_file',
    item.project_id,
    item.file_id,
    item.item_id
  FROM ai_search_items item
  WHERE item.file_id = old.entity_id;
END;

-- Existing projects and files are reconciled after the Worker is deployed. These
-- seed jobs ensure the first scheduled run provisions instances and uploads the
-- current D1 content without requiring a no-op content commit.
INSERT OR IGNORE INTO ai_search_jobs(
  id, dedupe_key, operation, project_id, expected_hash
)
SELECT
  'ai-job-' || lower(hex(randomblob(16))),
  'ensure:' || p.id || ':' || COALESCE(sync.content_hash, 'initial'),
  'ensure_instance',
  p.id,
  COALESCE(sync.content_hash, '')
FROM projects p
LEFT JOIN content_sync_entries sync
  ON sync.entity_type = 'project' AND sync.entity_id = p.id
WHERE p.deleted_at IS NULL;

INSERT OR IGNORE INTO ai_search_jobs(
  id, dedupe_key, operation, project_id, file_id, expected_hash
)
SELECT
  'ai-job-' || lower(hex(randomblob(16))),
  'upsert:' || n.id || ':' || file_sync.content_hash || ':' || project_sync.content_hash,
  'upsert_file',
  n.project_id,
  n.id,
  file_sync.content_hash || '|' || project_sync.content_hash
FROM nodes n
JOIN prompt_files pf ON pf.node_id = n.id
JOIN content_sync_entries file_sync
  ON file_sync.entity_type = 'file' AND file_sync.entity_id = n.id
JOIN content_sync_entries project_sync
  ON project_sync.entity_type = 'project' AND project_sync.entity_id = n.project_id
JOIN projects p ON p.id = n.project_id
WHERE n.node_type = 'file'
  AND n.deleted_at IS NULL
  AND p.deleted_at IS NULL;
