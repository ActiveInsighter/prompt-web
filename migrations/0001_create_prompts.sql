PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  language TEXT NOT NULL DEFAULT 'zh-CN',
  visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('public', 'private', 'system')),
  tags_text TEXT NOT NULL DEFAULT '',
  variables_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(variables_json)),
  metadata_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata_json)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_prompts_visibility_updated
  ON prompts (visibility, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_category
  ON prompts (category);
CREATE INDEX IF NOT EXISTS idx_prompts_language
  ON prompts (language);

CREATE TABLE IF NOT EXISTS prompt_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prompt_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  change_note TEXT NOT NULL DEFAULT '',
  metadata_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata_json)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (prompt_id, version),
  FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
);

CREATE VIRTUAL TABLE IF NOT EXISTS prompts_fts USING fts5(
  title,
  description,
  content,
  category,
  tags_text,
  content='prompts',
  content_rowid='rowid',
  tokenize='unicode61 remove_diacritics 2'
);

CREATE TRIGGER IF NOT EXISTS prompts_ai AFTER INSERT ON prompts BEGIN
  INSERT INTO prompts_fts(rowid, title, description, content, category, tags_text)
  VALUES (new.rowid, new.title, new.description, new.content, new.category, new.tags_text);
END;

CREATE TRIGGER IF NOT EXISTS prompts_ad AFTER DELETE ON prompts BEGIN
  INSERT INTO prompts_fts(prompts_fts, rowid, title, description, content, category, tags_text)
  VALUES ('delete', old.rowid, old.title, old.description, old.content, old.category, old.tags_text);
END;

CREATE TRIGGER IF NOT EXISTS prompts_au AFTER UPDATE ON prompts BEGIN
  INSERT INTO prompts_fts(prompts_fts, rowid, title, description, content, category, tags_text)
  VALUES ('delete', old.rowid, old.title, old.description, old.content, old.category, old.tags_text);
  INSERT INTO prompts_fts(rowid, title, description, content, category, tags_text)
  VALUES (new.rowid, new.title, new.description, new.content, new.category, new.tags_text);
END;

INSERT INTO prompts_fts(prompts_fts) VALUES ('rebuild');
