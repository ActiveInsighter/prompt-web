PRAGMA foreign_keys = ON;

-- Search documents are already the read model used by the API. The base prompt_files
-- language/role index is therefore redundant and adds index writes during every file change.
DROP INDEX IF EXISTS idx_prompt_files_language_role;

-- Synchronization planning reads content_sync_entries as a compact snapshot and never
-- filters by (project_id, last_seen_run_id, entity_type). Keep the uniqueness index, but
-- remove this write-amplifying secondary index.
DROP INDEX IF EXISTS idx_content_sync_entries_project_seen;

-- Rebuild update triggers so SQLite only refreshes the denormalized search row when a
-- value represented in that row actually changed. Previously every no-op UPSERT rewrote
-- prompt_search_documents and its FTS row several times per file.
DROP TRIGGER IF EXISTS prompt_files_au;
CREATE TRIGGER prompt_files_au
AFTER UPDATE OF
  title, description, content, language, format, prompt_role, variables_json,
  metadata_json, tags_text, current_version, created_at, updated_at
ON prompt_files
WHEN old.title IS NOT new.title
  OR old.description IS NOT new.description
  OR old.content IS NOT new.content
  OR old.language IS NOT new.language
  OR old.format IS NOT new.format
  OR old.prompt_role IS NOT new.prompt_role
  OR old.variables_json IS NOT new.variables_json
  OR old.metadata_json IS NOT new.metadata_json
  OR old.tags_text IS NOT new.tags_text
  OR old.current_version IS NOT new.current_version
  OR old.created_at IS NOT new.created_at
  OR old.updated_at IS NOT new.updated_at
BEGIN
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

DROP TRIGGER IF EXISTS nodes_file_au;
CREATE TRIGGER nodes_file_au
AFTER UPDATE OF project_id, parent_id, node_type, name, path, visibility, deleted_at
ON nodes
WHEN (old.node_type = 'file' OR new.node_type = 'file')
  AND (
    old.project_id IS NOT new.project_id
    OR old.parent_id IS NOT new.parent_id
    OR old.node_type IS NOT new.node_type
    OR old.name IS NOT new.name
    OR old.path IS NOT new.path
    OR old.visibility IS NOT new.visibility
    OR old.deleted_at IS NOT new.deleted_at
  )
BEGIN
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
    AND new.node_type = 'file'
    AND new.deleted_at IS NULL
    AND p.deleted_at IS NULL;
END;

DROP TRIGGER IF EXISTS projects_au;
CREATE TRIGGER projects_au
AFTER UPDATE OF slug, name, visibility, deleted_at
ON projects
WHEN old.slug IS NOT new.slug
  OR old.name IS NOT new.name
  OR old.visibility IS NOT new.visibility
  OR old.deleted_at IS NOT new.deleted_at
BEGIN
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
