PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS content_sync_runs (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  manifest_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'succeeded', 'failed', 'dry_run')),
  prune_requested INTEGER NOT NULL DEFAULT 0 CHECK (prune_requested IN (0, 1)),
  stats_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(stats_json)),
  error_text TEXT,
  started_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  finished_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_content_sync_runs_started
  ON content_sync_runs (started_at DESC);

CREATE TABLE IF NOT EXISTS content_sync_entries (
  sync_key TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'folder', 'file')),
  entity_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  source_path TEXT NOT NULL,
  content_hash TEXT NOT NULL DEFAULT '',
  last_seen_run_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (last_seen_run_id) REFERENCES content_sync_runs(id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_sync_entries_entity
  ON content_sync_entries (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_content_sync_entries_project_seen
  ON content_sync_entries (project_id, last_seen_run_id, entity_type);
