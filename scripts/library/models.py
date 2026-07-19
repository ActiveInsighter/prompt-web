from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
import hashlib
import json
from typing import Any


class ManifestValidationError(ValueError):
    """Raised when an in-memory manifest cannot map safely to the D1 schema."""


def canonical_json(value: Any) -> str:
    try:
        return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    except (TypeError, ValueError) as error:
        raise ManifestValidationError(
            f"Manifest values must be JSON serializable: {error}"
        ) from error


def sha256_value(value: Any) -> str:
    return f"sha256:{hashlib.sha256(canonical_json(value).encode('utf-8')).hexdigest()}"


def _check_length(value: str, maximum: int, field_name: str) -> None:
    if len(value) > maximum:
        raise ManifestValidationError(
            f"{field_name} exceeds the maximum length of {maximum}: {len(value)}"
        )


def _validate_manifest_contract(
    projects: list[dict[str, Any]],
    folders: list[dict[str, Any]],
    files: list[dict[str, Any]],
) -> None:
    if len(projects) > 50:
        raise ManifestValidationError("A manifest can contain at most 50 projects.")
    if len(folders) > 5000:
        raise ManifestValidationError("A manifest can contain at most 5000 folders.")
    if len(files) > 2000:
        raise ManifestValidationError("A manifest can contain at most 2000 files.")

    for project in projects:
        _check_length(project["id"], 160, f"project {project['id']} id")
        _check_length(project["slug"], 100, f"project {project['id']} slug")
        _check_length(project["name"], 200, f"project {project['id']} name")
        _check_length(project["description"], 2000, f"project {project['id']} description")
        _check_length(
            project["defaultLanguage"],
            50,
            f"project {project['id']} defaultLanguage",
        )
        _check_length(project["sourcePath"], 1000, f"project {project['id']} sourcePath")
        _check_length(project["configHash"], 100, f"project {project['id']} configHash")
        canonical_json(project["metadata"])

    for folder in folders:
        _check_length(folder["id"], 160, f"folder {folder['id']} id")
        _check_length(folder["projectId"], 160, f"folder {folder['id']} projectId")
        if folder["parentId"] is not None:
            _check_length(folder["parentId"], 160, f"folder {folder['id']} parentId")
        _check_length(folder["name"], 255, f"folder {folder['id']} name")
        _check_length(folder["path"], 1000, f"folder {folder['id']} path")
        _check_length(folder["sourcePath"], 1000, f"folder {folder['id']} sourcePath")
        _check_length(folder["configHash"], 100, f"folder {folder['id']} configHash")
        if not 0 <= folder["depth"] <= 100:
            raise ManifestValidationError(f"folder {folder['id']} depth must be between 0 and 100.")
        if not -1_000_000 <= folder["sortOrder"] <= 1_000_000:
            raise ManifestValidationError(
                f"folder {folder['id']} sortOrder is outside the supported range."
            )
        canonical_json(folder["metadata"])

    for document in files:
        _check_length(document["id"], 160, f"file {document['id']} id")
        _check_length(document["projectId"], 160, f"file {document['id']} projectId")
        if document["parentId"] is not None:
            _check_length(document["parentId"], 160, f"file {document['id']} parentId")
        _check_length(document["name"], 255, f"file {document['id']} name")
        _check_length(document["path"], 1000, f"file {document['id']} path")
        _check_length(document["title"], 500, f"file {document['id']} title")
        _check_length(document["description"], 4000, f"file {document['id']} description")
        _check_length(document["content"], 500_000, f"file {document['id']} content")
        _check_length(document["language"], 50, f"file {document['id']} language")
        _check_length(document["sourcePath"], 1000, f"file {document['id']} sourcePath")
        _check_length(document["contentHash"], 100, f"file {document['id']} contentHash")
        _check_length(document["syncHash"], 100, f"file {document['id']} syncHash")
        if not 0 <= document["depth"] <= 100:
            raise ManifestValidationError(f"file {document['id']} depth must be between 0 and 100.")
        if not -1_000_000 <= document["sortOrder"] <= 1_000_000:
            raise ManifestValidationError(
                f"file {document['id']} sortOrder is outside the supported range."
            )
        if len(document["tags"]) > 20:
            raise ManifestValidationError(f"file {document['id']} can contain at most 20 tags.")
        for tag in document["tags"]:
            _check_length(tag, 100, f"file {document['id']} tag")
            if "," in tag:
                raise ManifestValidationError(
                    f"file {document['id']} tags cannot contain commas: {tag}"
                )
        if len(document["variables"]) > 100:
            raise ManifestValidationError(
                f"file {document['id']} can contain at most 100 variables."
            )
        for variable in document["variables"]:
            _check_length(variable, 100, f"file {document['id']} variable")
        canonical_json(document["metadata"])


@dataclass(frozen=True)
class ProjectSpec:
    id: str
    slug: str
    name: str
    description: str
    visibility: str
    default_language: str
    metadata: dict[str, Any]
    source_path: str
    config_hash: str
    prune: bool

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "slug": self.slug,
            "name": self.name,
            "description": self.description,
            "visibility": self.visibility,
            "defaultLanguage": self.default_language,
            "metadata": self.metadata,
            "sourcePath": self.source_path,
            "configHash": self.config_hash,
            "prune": self.prune,
        }


@dataclass(frozen=True)
class FolderSpec:
    id: str
    project_id: str
    parent_id: str | None
    name: str
    path: str
    depth: int
    sort_order: int
    visibility: str | None
    metadata: dict[str, Any]
    source_path: str
    config_hash: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "projectId": self.project_id,
            "parentId": self.parent_id,
            "name": self.name,
            "path": self.path,
            "depth": self.depth,
            "sortOrder": self.sort_order,
            "visibility": self.visibility,
            "metadata": self.metadata,
            "sourcePath": self.source_path,
            "configHash": self.config_hash,
        }


@dataclass(frozen=True)
class FileSpec:
    id: str
    project_id: str
    parent_id: str | None
    name: str
    path: str
    depth: int
    sort_order: int
    visibility: str | None
    title: str
    description: str
    content: str
    language: str
    format: str
    prompt_role: str
    tags: list[str]
    variables: list[str]
    metadata: dict[str, Any]
    source_path: str
    content_hash: str
    sync_hash: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "projectId": self.project_id,
            "parentId": self.parent_id,
            "name": self.name,
            "path": self.path,
            "depth": self.depth,
            "sortOrder": self.sort_order,
            "visibility": self.visibility,
            "title": self.title,
            "description": self.description,
            "content": self.content,
            "language": self.language,
            "format": self.format,
            "promptRole": self.prompt_role,
            "tags": self.tags,
            "variables": self.variables,
            "metadata": self.metadata,
            "sourcePath": self.source_path,
            "contentHash": self.content_hash,
            "syncHash": self.sync_hash,
        }


@dataclass(frozen=True)
class ContentManifest:
    projects: list[ProjectSpec] = field(default_factory=list)
    folders: list[FolderSpec] = field(default_factory=list)
    files: list[FileSpec] = field(default_factory=list)
    source: str = "repository-content"
    generated_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc)
        .isoformat(timespec="seconds")
        .replace("+00:00", "Z")
    )

    def to_dict(self) -> dict[str, Any]:
        node_ids: dict[str, str] = {}
        for entity_type, entities in (("folder", self.folders), ("file", self.files)):
            for entity in entities:
                existing = node_ids.get(entity.id)
                if existing is not None:
                    raise ManifestValidationError(
                        f"Node id {entity.id} is already used by a {existing}."
                    )
                node_ids[entity.id] = entity_type

        projects = [item.to_dict() for item in self.projects]
        folders = [item.to_dict() for item in self.folders]
        files = [item.to_dict() for item in self.files]
        _validate_manifest_contract(projects, folders, files)
        hash_payload = {
            "schemaVersion": 1,
            "source": self.source,
            "projects": projects,
            "folders": folders,
            "files": files,
        }
        return {
            "schemaVersion": 1,
            "manifestHash": sha256_value(hash_payload),
            "source": self.source,
            "generatedAt": self.generated_at,
            "projects": projects,
            "folders": folders,
            "files": files,
        }
