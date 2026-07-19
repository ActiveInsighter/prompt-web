from __future__ import annotations

import json
from pathlib import Path, PurePosixPath
import re
import unicodedata
from typing import Any

import yaml

from .models import ContentManifest, FileSpec, FolderSpec, ProjectSpec, sha256_value


SUPPORTED_EXTENSIONS = {".md": "markdown", ".txt": "text", ".json": "json"}
VALID_VISIBILITIES = {"public", "private"}
VALID_ROLES = {"system", "developer", "user", "template", "reference"}
WINDOWS_RESERVED = {
    "CON", "PRN", "AUX", "NUL",
    *(f"COM{index}" for index in range(1, 10)),
    *(f"LPT{index}" for index in range(1, 10)),
}
INVALID_WINDOWS_CHARS = set('<>:"\\|?*')
VARIABLE_PATTERN = re.compile(r"\{\{\s*([\w.-]+)\s*\}\}", re.UNICODE)


class ContentValidationError(ValueError):
    pass


def _normalize_component(value: str) -> str:
    return unicodedata.normalize("NFC", value)


def _validate_component(value: str, source: Path) -> None:
    if not value or value in {".", ".."}:
        raise ContentValidationError(f"Invalid path component in {source}")
    if value[-1] in {" ", "."}:
        raise ContentValidationError(f"Path component cannot end with space or dot: {source}")
    if any(char in INVALID_WINDOWS_CHARS for char in value):
        raise ContentValidationError(f"Windows-incompatible character in path: {source}")
    stem = value.split(".", 1)[0].upper()
    if stem in WINDOWS_RESERVED:
        raise ContentValidationError(f"Windows-reserved path name: {source}")


def _relative_posix(path: Path, root: Path) -> str:
    return PurePosixPath(*path.relative_to(root).parts).as_posix()


def _library_path(relative_path: Path) -> str:
    parts = [_normalize_component(part) for part in relative_path.parts]
    return "/" + PurePosixPath(*parts).as_posix()


def _depth(path: str) -> int:
    return len([part for part in path.split("/") if part]) - 1


def _stable_id(prefix: str, project_id: str, path: str) -> str:
    digest = sha256_value({"projectId": project_id, "path": path}).split(":", 1)[1][:24]
    return f"{prefix}-{digest}"


def _load_yaml(path: Path) -> dict[str, Any]:
    try:
        parsed = yaml.safe_load(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, yaml.YAMLError) as error:
        raise ContentValidationError(f"Cannot read YAML {path}: {error}") from error
    if parsed is None:
        return {}
    if not isinstance(parsed, dict):
        raise ContentValidationError(f"YAML root must be an object: {path}")
    return parsed


def _parse_frontmatter(text: str, source: Path) -> tuple[dict[str, Any], str]:
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    if not normalized.startswith("---\n"):
        return {}, normalized
    closing = normalized.find("\n---\n", 4)
    if closing < 0:
        raise ContentValidationError(f"Unclosed YAML front matter: {source}")
    raw = normalized[4:closing]
    try:
        metadata = yaml.safe_load(raw) or {}
    except yaml.YAMLError as error:
        raise ContentValidationError(f"Invalid YAML front matter in {source}: {error}") from error
    if not isinstance(metadata, dict):
        raise ContentValidationError(f"Front matter must be an object: {source}")
    return metadata, normalized[closing + 5 :]


def _string(value: Any, field_name: str, source: Path, default: str = "") -> str:
    if value is None:
        return default
    if not isinstance(value, str):
        raise ContentValidationError(f"{field_name} must be a string: {source}")
    return value.strip()


def _integer(value: Any, field_name: str, source: Path, default: int = 0) -> int:
    if value is None:
        return default
    if isinstance(value, bool) or not isinstance(value, int):
        raise ContentValidationError(f"{field_name} must be an integer: {source}")
    return value


def _string_list(value: Any, field_name: str, source: Path) -> list[str]:
    if value is None:
        return []
    if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
        raise ContentValidationError(f"{field_name} must be a string list: {source}")
    return list(dict.fromkeys(item.strip() for item in value if item.strip()))


def _metadata(value: Any, source: Path) -> dict[str, Any]:
    if value is None:
        return {}
    if not isinstance(value, dict):
        raise ContentValidationError(f"metadata must be an object: {source}")
    try:
        json.dumps(value, ensure_ascii=False)
    except (TypeError, ValueError) as error:
        raise ContentValidationError(f"metadata must be JSON serializable: {source}") from error
    return value


def _default_title(content: str, source: Path) -> str:
    for line in content.splitlines():
        match = re.match(r"^#\s+(.+?)\s*$", line)
        if match:
            return match.group(1).strip()
    return source.stem


def _default_description(content: str) -> str:
    paragraphs: list[str] = []
    current: list[str] = []
    in_fence = False
    for line in content.splitlines():
        stripped = line.strip()
        if stripped.startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence or stripped.startswith("#") or stripped.startswith("---"):
            continue
        if not stripped:
            if current:
                paragraphs.append(" ".join(current))
                break
            continue
        current.append(stripped)
    if current and not paragraphs:
        paragraphs.append(" ".join(current))
    return (paragraphs[0][:300] if paragraphs else "").strip()


def _effective_metadata(frontmatter: dict[str, Any], source: Path) -> dict[str, Any]:
    known = {
        "id", "title", "description", "language", "role", "prompt_role",
        "visibility", "tags", "variables", "sort", "metadata",
    }
    result = dict(_metadata(frontmatter.get("metadata"), source))
    for key, value in frontmatter.items():
        if key not in known:
            result[key] = value
    return result


def _scan_project(project_dir: Path, repository_root: Path) -> tuple[
    ProjectSpec, list[FolderSpec], list[FileSpec]
]:
    config_path = project_dir / "_project.yaml"
    if not config_path.is_file():
        raise ContentValidationError(f"Missing _project.yaml in project directory: {project_dir}")
    config = _load_yaml(config_path)

    project_id = _string(config.get("id"), "id", config_path)
    slug = _string(config.get("slug"), "slug", config_path)
    name = _string(config.get("name"), "name", config_path)
    if not project_id or not slug or not name:
        raise ContentValidationError(f"Project id, slug and name are required: {config_path}")
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._:-]*", project_id):
        raise ContentValidationError(f"Invalid project id: {project_id}")
    if not re.fullmatch(r"[a-z0-9][a-z0-9_-]*", slug):
        raise ContentValidationError(f"Invalid project slug: {slug}")

    visibility = _string(config.get("visibility"), "visibility", config_path, "private")
    if visibility not in VALID_VISIBILITIES:
        raise ContentValidationError(f"Invalid project visibility in {config_path}")
    default_language = _string(
        config.get("default_language"), "default_language", config_path, "zh-CN"
    )
    sync_config = config.get("sync") or {}
    if not isinstance(sync_config, dict):
        raise ContentValidationError(f"sync must be an object: {config_path}")
    enabled = sync_config.get("enabled", True)
    if not isinstance(enabled, bool):
        raise ContentValidationError(f"sync.enabled must be boolean: {config_path}")
    if not enabled:
        raise ContentValidationError(
            f"Disabled projects should be moved outside content/: {project_dir}"
        )
    prune = sync_config.get("prune", False)
    if not isinstance(prune, bool):
        raise ContentValidationError(f"sync.prune must be boolean: {config_path}")

    project_payload = {
        "id": project_id,
        "slug": slug,
        "name": name,
        "description": _string(config.get("description"), "description", config_path),
        "visibility": visibility,
        "defaultLanguage": default_language,
        "metadata": _metadata(config.get("metadata"), config_path),
        "prune": prune,
    }
    project = ProjectSpec(
        id=project_id,
        slug=slug,
        name=name,
        description=project_payload["description"],
        visibility=visibility,
        default_language=default_language,
        metadata=project_payload["metadata"],
        source_path=_relative_posix(config_path, repository_root),
        config_hash=sha256_value(project_payload),
        prune=prune,
    )

    folders: list[FolderSpec] = []
    folder_by_path: dict[str, FolderSpec] = {}
    files: list[FileSpec] = []

    directories = sorted(
        (path for path in project_dir.rglob("*") if path.is_dir()),
        key=lambda path: (len(path.relative_to(project_dir).parts), path.as_posix().casefold()),
    )
    for directory in directories:
        if directory.name.startswith(".") or any(part.startswith(".") for part in directory.relative_to(project_dir).parts):
            continue
        if directory.is_symlink():
            raise ContentValidationError(f"Symlink directories are not allowed: {directory}")
        for part in directory.relative_to(project_dir).parts:
            _validate_component(part, directory)

        relative = directory.relative_to(project_dir)
        library_path = _library_path(relative)
        folder_config_path = directory / "_folder.yaml"
        folder_config = _load_yaml(folder_config_path) if folder_config_path.is_file() else {}
        folder_id = _string(folder_config.get("id"), "id", folder_config_path)
        if not folder_id:
            folder_id = _stable_id("folder", project_id, library_path)
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._:-]*", folder_id):
            raise ContentValidationError(f"Invalid folder id: {folder_id}")

        parent_library_path = "/" + PurePosixPath(*relative.parts[:-1]).as_posix() if len(relative.parts) > 1 else "/"
        parent = folder_by_path.get(parent_library_path)
        folder_visibility = folder_config.get("visibility")
        if folder_visibility is not None:
            folder_visibility = _string(folder_visibility, "visibility", folder_config_path)
            if folder_visibility not in VALID_VISIBILITIES:
                raise ContentValidationError(f"Invalid folder visibility: {folder_config_path}")

        metadata = _metadata(folder_config.get("metadata"), folder_config_path)
        folder_payload = {
            "id": folder_id,
            "projectId": project_id,
            "parentId": parent.id if parent else None,
            "name": _normalize_component(directory.name),
            "path": library_path,
            "depth": _depth(library_path),
            "sortOrder": _integer(folder_config.get("sort"), "sort", folder_config_path),
            "visibility": folder_visibility,
            "metadata": metadata,
        }
        source_path = (
            _relative_posix(folder_config_path, repository_root)
            if folder_config_path.is_file()
            else _relative_posix(directory, repository_root)
        )
        folder = FolderSpec(
            id=folder_id,
            project_id=project_id,
            parent_id=parent.id if parent else None,
            name=folder_payload["name"],
            path=library_path,
            depth=folder_payload["depth"],
            sort_order=folder_payload["sortOrder"],
            visibility=folder_visibility,
            metadata=metadata,
            source_path=source_path,
            config_hash=sha256_value(folder_payload),
        )
        folders.append(folder)
        folder_by_path[library_path] = folder

    candidates = sorted(
        (
            path
            for path in project_dir.rglob("*")
            if path.is_file()
            and path.suffix.lower() in SUPPORTED_EXTENSIONS
            and not path.name.startswith("_")
            and not any(part.startswith(".") for part in path.relative_to(project_dir).parts)
        ),
        key=lambda path: path.as_posix().casefold(),
    )
    seen_casefold_paths: set[str] = set()
    for source in candidates:
        if source.is_symlink():
            raise ContentValidationError(f"Symlink files are not allowed: {source}")
        for part in source.relative_to(project_dir).parts:
            _validate_component(part, source)
        casefold_path = _relative_posix(source, project_dir).casefold()
        if casefold_path in seen_casefold_paths:
            raise ContentValidationError(f"Case-insensitive duplicate path: {source}")
        seen_casefold_paths.add(casefold_path)

        try:
            raw = source.read_text(encoding="utf-8")
        except (OSError, UnicodeError) as error:
            raise ContentValidationError(f"Cannot read UTF-8 document {source}: {error}") from error
        frontmatter, content = _parse_frontmatter(raw, source)
        content = content.rstrip() + "\n" if content else ""

        format_name = SUPPORTED_EXTENSIONS[source.suffix.lower()]
        if format_name == "json":
            try:
                json.loads(content)
            except json.JSONDecodeError as error:
                raise ContentValidationError(f"Invalid JSON document {source}: {error}") from error

        relative = source.relative_to(project_dir)
        library_path = _library_path(relative)
        parent_library_path = "/" + PurePosixPath(*relative.parts[:-1]).as_posix() if len(relative.parts) > 1 else "/"
        parent = folder_by_path.get(parent_library_path)
        file_id = _string(frontmatter.get("id"), "id", source)
        if not file_id:
            file_id = _stable_id("file", project_id, library_path)
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._:-]*", file_id):
            raise ContentValidationError(f"Invalid file id: {file_id}")

        file_visibility = frontmatter.get("visibility")
        if file_visibility is not None:
            file_visibility = _string(file_visibility, "visibility", source)
            if file_visibility not in VALID_VISIBILITIES:
                raise ContentValidationError(f"Invalid file visibility: {source}")
        prompt_role = _string(
            frontmatter.get("role", frontmatter.get("prompt_role")),
            "role",
            source,
            "template",
        )
        if prompt_role not in VALID_ROLES:
            raise ContentValidationError(f"Invalid prompt role: {source}")

        title = _string(frontmatter.get("title"), "title", source) or _default_title(content, source)
        description = (
            _string(frontmatter.get("description"), "description", source)
            or _default_description(content)
        )
        tags = _string_list(frontmatter.get("tags"), "tags", source)
        explicit_variables = _string_list(frontmatter.get("variables"), "variables", source)
        discovered_variables = VARIABLE_PATTERN.findall(content)
        variables = list(dict.fromkeys([*explicit_variables, *discovered_variables]))
        metadata = _effective_metadata(frontmatter, source)
        language = _string(
            frontmatter.get("language"), "language", source, project.default_language
        )
        sort_order = _integer(frontmatter.get("sort"), "sort", source)

        prompt_payload = {
            "title": title,
            "description": description,
            "content": content,
            "language": language,
            "format": format_name,
            "promptRole": prompt_role,
            "tags": tags,
            "variables": variables,
            "metadata": metadata,
        }
        content_hash = sha256_value(prompt_payload)
        sync_payload = {
            "id": file_id,
            "projectId": project_id,
            "parentId": parent.id if parent else None,
            "name": _normalize_component(source.name),
            "path": library_path,
            "depth": _depth(library_path),
            "sortOrder": sort_order,
            "visibility": file_visibility,
            "contentHash": content_hash,
        }
        files.append(
            FileSpec(
                id=file_id,
                project_id=project_id,
                parent_id=parent.id if parent else None,
                name=sync_payload["name"],
                path=library_path,
                depth=sync_payload["depth"],
                sort_order=sort_order,
                visibility=file_visibility,
                title=title,
                description=description,
                content=content,
                language=language,
                format=format_name,
                prompt_role=prompt_role,
                tags=tags,
                variables=variables,
                metadata=metadata,
                source_path=_relative_posix(source, repository_root),
                content_hash=content_hash,
                sync_hash=sha256_value(sync_payload),
            )
        )

    return project, folders, files


def scan_content(content_root: Path, repository_root: Path | None = None) -> ContentManifest:
    content_root = content_root.resolve()
    repository_root = (repository_root or content_root.parent).resolve()
    if not content_root.is_dir():
        raise ContentValidationError(f"Content root does not exist: {content_root}")
    if content_root.is_symlink():
        raise ContentValidationError("Content root cannot be a symlink.")

    projects: list[ProjectSpec] = []
    folders: list[FolderSpec] = []
    files: list[FileSpec] = []

    project_dirs = sorted(
        (
            path
            for path in content_root.iterdir()
            if path.is_dir() and not path.name.startswith(".")
        ),
        key=lambda path: path.name.casefold(),
    )
    if not project_dirs:
        raise ContentValidationError("content/ must contain at least one project directory.")

    seen_project_ids: set[str] = set()
    seen_project_slugs: set[str] = set()
    seen_entity_ids: set[tuple[str, str]] = set()
    seen_paths: set[tuple[str, str]] = set()

    for project_dir in project_dirs:
        _validate_component(project_dir.name, project_dir)
        project, project_folders, project_files = _scan_project(
            project_dir, repository_root
        )
        if project.id in seen_project_ids:
            raise ContentValidationError(f"Duplicate project id: {project.id}")
        if project.slug in seen_project_slugs:
            raise ContentValidationError(f"Duplicate project slug: {project.slug}")
        seen_project_ids.add(project.id)
        seen_project_slugs.add(project.slug)
        projects.append(project)

        for entity_type, entities in (("folder", project_folders), ("file", project_files)):
            for entity in entities:
                entity_key = (entity_type, entity.id)
                path_key = (entity.project_id, entity.path.casefold())
                if entity_key in seen_entity_ids:
                    raise ContentValidationError(
                        f"Duplicate {entity_type} id: {entity.id}"
                    )
                if path_key in seen_paths:
                    raise ContentValidationError(
                        f"Duplicate project path: {entity.path}"
                    )
                seen_entity_ids.add(entity_key)
                seen_paths.add(path_key)

        folders.extend(project_folders)
        files.extend(project_files)

    return ContentManifest(
        projects=sorted(projects, key=lambda item: item.slug),
        folders=sorted(folders, key=lambda item: (item.project_id, item.depth, item.path)),
        files=sorted(files, key=lambda item: (item.project_id, item.path)),
    )


def summary(manifest: ContentManifest) -> str:
    return (
        f"projects={len(manifest.projects)} "
        f"folders={len(manifest.folders)} "
        f"files={len(manifest.files)} "
        f"manifest={manifest.to_dict()['manifestHash']}"
    )
