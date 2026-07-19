PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('public', 'private')),
  default_language TEXT NOT NULL DEFAULT 'zh-CN',
  owner_id TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata_json)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_projects_visibility_updated
  ON projects (visibility, updated_at DESC);

CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  parent_id TEXT,
  node_type TEXT NOT NULL CHECK (node_type IN ('folder', 'file')),
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  depth INTEGER NOT NULL DEFAULT 0 CHECK (depth >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  visibility TEXT CHECK (visibility IS NULL OR visibility IN ('public', 'private')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES nodes(id) ON DELETE CASCADE,
  CHECK (path = '/' OR substr(path, 1, 1) = '/')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_nodes_project_path_active
  ON nodes (project_id, path)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_nodes_parent_sort
  ON nodes (project_id, parent_id, node_type, sort_order, name);
CREATE INDEX IF NOT EXISTS idx_nodes_project_type
  ON nodes (project_id, node_type, updated_at DESC);

CREATE TABLE IF NOT EXISTS prompt_files (
  node_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'zh-CN',
  format TEXT NOT NULL DEFAULT 'markdown'
    CHECK (format IN ('markdown', 'text', 'json')),
  prompt_role TEXT NOT NULL DEFAULT 'template'
    CHECK (prompt_role IN ('system', 'developer', 'user', 'template', 'reference')),
  variables_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(variables_json)),
  metadata_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata_json)),
  tags_text TEXT NOT NULL DEFAULT '',
  content_hash TEXT NOT NULL DEFAULT '',
  current_version INTEGER NOT NULL DEFAULT 1 CHECK (current_version >= 1),
  token_count INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prompt_files_language_role
  ON prompt_files (language, prompt_role, updated_at DESC);

CREATE TABLE IF NOT EXISTS prompt_file_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  variables_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(variables_json)),
  metadata_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata_json)),
  change_note TEXT NOT NULL DEFAULT '',
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (file_id, version_number),
  FOREIGN KEY (file_id) REFERENCES prompt_files(node_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS file_tags (
  file_id TEXT NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (file_id, tag_id),
  FOREIGN KEY (file_id) REFERENCES prompt_files(node_id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_file_tags_tag_file
  ON file_tags (tag_id, file_id);

CREATE TABLE IF NOT EXISTS prompt_search_documents (
  file_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  project_slug TEXT NOT NULL,
  project_name TEXT NOT NULL,
  path TEXT NOT NULL,
  parent_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT NOT NULL,
  format TEXT NOT NULL,
  prompt_role TEXT NOT NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private')),
  tags_text TEXT NOT NULL,
  variables_json TEXT NOT NULL CHECK (json_valid(variables_json)),
  metadata_json TEXT NOT NULL CHECK (json_valid(metadata_json)),
  current_version INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (file_id) REFERENCES prompt_files(node_id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prompt_search_project_path
  ON prompt_search_documents (project_id, parent_path, path);
CREATE INDEX IF NOT EXISTS idx_prompt_search_visibility_updated
  ON prompt_search_documents (visibility, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_search_language_role
  ON prompt_search_documents (language, prompt_role);

CREATE VIRTUAL TABLE IF NOT EXISTS prompt_search_fts USING fts5(
  file_id UNINDEXED,
  title,
  file_name,
  path,
  description,
  content,
  tags_text,
  tokenize='unicode61 remove_diacritics 2'
);

CREATE TRIGGER IF NOT EXISTS prompt_search_documents_ai
AFTER INSERT ON prompt_search_documents BEGIN
  INSERT INTO prompt_search_fts(file_id, title, file_name, path, description, content, tags_text)
  VALUES (new.file_id, new.title, new.file_name, new.path, new.description, new.content, new.tags_text);
END;

CREATE TRIGGER IF NOT EXISTS prompt_search_documents_ad
AFTER DELETE ON prompt_search_documents BEGIN
  DELETE FROM prompt_search_fts WHERE file_id = old.file_id;
END;

CREATE TRIGGER IF NOT EXISTS prompt_search_documents_au
AFTER UPDATE ON prompt_search_documents BEGIN
  DELETE FROM prompt_search_fts WHERE file_id = old.file_id;
  INSERT INTO prompt_search_fts(file_id, title, file_name, path, description, content, tags_text)
  VALUES (new.file_id, new.title, new.file_name, new.path, new.description, new.content, new.tags_text);
END;

CREATE TRIGGER IF NOT EXISTS prompt_files_ai
AFTER INSERT ON prompt_files BEGIN
  INSERT INTO prompt_search_documents(
    file_id, project_id, project_slug, project_name, path, parent_path, file_name,
    title, description, content, language, format, prompt_role, visibility, tags_text,
    variables_json, metadata_json, current_version, created_at, updated_at
  )
  SELECT
    new.node_id, n.project_id, p.slug, p.name, n.path,
    COALESCE(parent.path, '/'), n.name,
    new.title, new.description, new.content, new.language, new.format, new.prompt_role,
    COALESCE(n.visibility, p.visibility), new.tags_text,
    new.variables_json, new.metadata_json, new.current_version,
    new.created_at, new.updated_at
  FROM nodes n
  JOIN projects p ON p.id = n.project_id
  LEFT JOIN nodes parent ON parent.id = n.parent_id
  WHERE n.id = new.node_id
    AND n.node_type = 'file'
    AND n.deleted_at IS NULL
    AND p.deleted_at IS NULL;
END;

CREATE TRIGGER IF NOT EXISTS prompt_files_au
AFTER UPDATE ON prompt_files BEGIN
  DELETE FROM prompt_search_documents WHERE file_id = old.node_id;
  INSERT INTO prompt_search_documents(
    file_id, project_id, project_slug, project_name, path, parent_path, file_name,
    title, description, content, language, format, prompt_role, visibility, tags_text,
    variables_json, metadata_json, current_version, created_at, updated_at
  )
  SELECT
    new.node_id, n.project_id, p.slug, p.name, n.path,
    COALESCE(parent.path, '/'), n.name,
    new.title, new.description, new.content, new.language, new.format, new.prompt_role,
    COALESCE(n.visibility, p.visibility), new.tags_text,
    new.variables_json, new.metadata_json, new.current_version,
    new.created_at, new.updated_at
  FROM nodes n
  JOIN projects p ON p.id = n.project_id
  LEFT JOIN nodes parent ON parent.id = n.parent_id
  WHERE n.id = new.node_id
    AND n.node_type = 'file'
    AND n.deleted_at IS NULL
    AND p.deleted_at IS NULL;
END;

CREATE TRIGGER IF NOT EXISTS prompt_files_ad
AFTER DELETE ON prompt_files BEGIN
  DELETE FROM prompt_search_documents WHERE file_id = old.node_id;
END;

CREATE TRIGGER IF NOT EXISTS nodes_file_au
AFTER UPDATE ON nodes
WHEN new.node_type = 'file' BEGIN
  DELETE FROM prompt_search_documents WHERE file_id = old.id;
  INSERT INTO prompt_search_documents(
    file_id, project_id, project_slug, project_name, path, parent_path, file_name,
    title, description, content, language, format, prompt_role, visibility, tags_text,
    variables_json, metadata_json, current_version, created_at, updated_at
  )
  SELECT
    pf.node_id, new.project_id, p.slug, p.name, new.path,
    COALESCE(parent.path, '/'), new.name,
    pf.title, pf.description, pf.content, pf.language, pf.format, pf.prompt_role,
    COALESCE(new.visibility, p.visibility), pf.tags_text,
    pf.variables_json, pf.metadata_json, pf.current_version,
    pf.created_at, pf.updated_at
  FROM prompt_files pf
  JOIN projects p ON p.id = new.project_id
  LEFT JOIN nodes parent ON parent.id = new.parent_id
  WHERE pf.node_id = new.id
    AND new.deleted_at IS NULL
    AND p.deleted_at IS NULL;
END;

CREATE TRIGGER IF NOT EXISTS projects_au
AFTER UPDATE ON projects BEGIN
  DELETE FROM prompt_search_documents WHERE project_id = old.id;
  INSERT INTO prompt_search_documents(
    file_id, project_id, project_slug, project_name, path, parent_path, file_name,
    title, description, content, language, format, prompt_role, visibility, tags_text,
    variables_json, metadata_json, current_version, created_at, updated_at
  )
  SELECT
    pf.node_id, new.id, new.slug, new.name, n.path,
    COALESCE(parent.path, '/'), n.name,
    pf.title, pf.description, pf.content, pf.language, pf.format, pf.prompt_role,
    COALESCE(n.visibility, new.visibility), pf.tags_text,
    pf.variables_json, pf.metadata_json, pf.current_version,
    pf.created_at, pf.updated_at
  FROM nodes n
  JOIN prompt_files pf ON pf.node_id = n.id
  LEFT JOIN nodes parent ON parent.id = n.parent_id
  WHERE n.project_id = new.id
    AND n.node_type = 'file'
    AND n.deleted_at IS NULL
    AND new.deleted_at IS NULL;
END;

-- Migrate the original flat prompt table into a default project and one folder per category.
INSERT OR IGNORE INTO projects(
  id, slug, name, description, visibility, default_language, metadata_json
) VALUES (
  'project-prompt-library',
  'prompt-library',
  'Prompt Library',
  'Migrated prompts from the original flat prompt schema.',
  'public',
  'zh-CN',
  '{"migratedFrom":"prompts"}'
);

INSERT OR IGNORE INTO nodes(
  id, project_id, parent_id, node_type, name, path, depth, sort_order, visibility
)
SELECT DISTINCT
  'legacy-folder-' || lower(hex(category)),
  'project-prompt-library',
  NULL,
  'folder',
  category,
  '/' || category,
  0,
  0,
  NULL
FROM prompts
WHERE deleted_at IS NULL;

INSERT OR IGNORE INTO nodes(
  id, project_id, parent_id, node_type, name, path, depth, sort_order,
  visibility, created_at, updated_at, deleted_at
)
SELECT
  p.id,
  'project-prompt-library',
  'legacy-folder-' || lower(hex(p.category)),
  'file',
  CASE
    WHEN instr(p.slug, '/') > 0 THEN substr(p.slug, instr(p.slug, '/') + 1)
    ELSE p.slug
  END || '.md',
  '/' || p.slug || '.md',
  (length(p.slug) - length(replace(p.slug, '/', ''))) + 1,
  0,
  CASE WHEN p.visibility = 'system' THEN 'private' ELSE p.visibility END,
  p.created_at,
  p.updated_at,
  p.deleted_at
FROM prompts p;

INSERT OR IGNORE INTO prompt_files(
  node_id, title, description, content, language, format, prompt_role,
  variables_json, metadata_json, tags_text, current_version, created_at, updated_at
)
SELECT
  p.id,
  p.title,
  p.description,
  p.content,
  p.language,
  'markdown',
  CASE WHEN p.visibility = 'system' THEN 'system' ELSE 'template' END,
  p.variables_json,
  p.metadata_json,
  p.tags_text,
  COALESCE((SELECT MAX(v.version) FROM prompt_versions v WHERE v.prompt_id = p.id), 1),
  p.created_at,
  p.updated_at
FROM prompts p
WHERE p.deleted_at IS NULL;

INSERT OR IGNORE INTO prompt_file_versions(
  file_id, version_number, content, variables_json, metadata_json, change_note, created_at
)
SELECT
  v.prompt_id,
  v.version,
  v.content,
  COALESCE((SELECT p.variables_json FROM prompts p WHERE p.id = v.prompt_id), '[]'),
  v.metadata_json,
  v.change_note,
  v.created_at
FROM prompt_versions v
JOIN prompt_files pf ON pf.node_id = v.prompt_id;
