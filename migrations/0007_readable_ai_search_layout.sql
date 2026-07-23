PRAGMA foreign_keys = ON;

-- Project instances are now named directly from the readable project slug.
-- During migration `instance_id` remains the active searchable instance and
-- `replacement_instance_id` points at the readable instance being populated.
-- The Worker switches the mapping only after every replacement Item completes.
ALTER TABLE ai_search_projects ADD COLUMN replacement_instance_id TEXT;

DROP TRIGGER IF EXISTS content_sync_entries_ai_file_delete;
DROP TRIGGER IF EXISTS ai_search_nodes_require_remote_cleanup;
DROP TRIGGER IF EXISTS ai_search_projects_require_remote_cleanup;

-- `items.upload()` only queues work. The former schema marked the item indexed
-- immediately, which allowed D1 to report success while Cloudflare still showed
-- running or error. Rebuild the table with truthful local processing states and
-- fields that retain the prior searchable item until the replacement completes.
CREATE TABLE ai_search_items_readable_layout (
  file_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  instance_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_key TEXT NOT NULL,
  index_hash TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'indexed', 'error')),
  chunks_count INTEGER,
  last_error TEXT,
  indexed_at TEXT,
  checked_at TEXT,
  previous_instance_id TEXT,
  previous_item_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (file_id) REFERENCES nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

INSERT INTO ai_search_items_readable_layout(
  file_id, project_id, instance_id, item_id, item_key, index_hash,
  content_hash, status, chunks_count, last_error, indexed_at, checked_at,
  previous_instance_id, previous_item_id, created_at, updated_at
)
SELECT
  file_id, project_id, instance_id, item_id, item_key, index_hash,
  content_hash, 'indexed', chunks_count,
  NULL, indexed_at, NULL, NULL, NULL, created_at, updated_at
FROM ai_search_items;

DROP TABLE ai_search_items;
ALTER TABLE ai_search_items_readable_layout RENAME TO ai_search_items;

CREATE INDEX idx_ai_search_items_project
  ON ai_search_items (project_id, status, updated_at);
CREATE INDEX idx_ai_search_items_instance
  ON ai_search_items (instance_id, status);
CREATE INDEX idx_ai_search_items_verification
  ON ai_search_items (status, checked_at, created_at);

-- Preserve ready legacy mappings so search continues to use them while the
-- readable replacements are built. Reconciliation detects the name mismatch.
UPDATE ai_search_projects
SET replacement_instance_id = NULL,
    last_error = NULL,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now');

CREATE TRIGGER content_sync_entries_ai_file_delete
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

CREATE TRIGGER ai_search_nodes_require_remote_cleanup
BEFORE DELETE ON nodes
WHEN EXISTS (
  SELECT 1 FROM ai_search_items item WHERE item.file_id = old.id
)
BEGIN
  SELECT RAISE(ABORT, 'Remove the AI Search item before hard-deleting this node.');
END;

CREATE TRIGGER ai_search_projects_require_remote_cleanup
BEFORE DELETE ON projects
WHEN EXISTS (
  SELECT 1 FROM ai_search_projects mapping WHERE mapping.project_id = old.id
)
BEGIN
  SELECT RAISE(ABORT, 'Remove the AI Search instance before hard-deleting this project.');
END;
