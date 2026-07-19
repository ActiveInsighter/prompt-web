from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
import hashlib
import json
from typing import Any


class ManifestValidationError(ValueError):
    """Raised when an in-memory manifest cannot map safely to the D1 schema."""


def canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def sha256_value(value: Any) -> str:
    return f"sha256:{hashlib.sha256(canonical_json(value).encode('utf-8')).hexdigest()}"


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
        default_factory=lambda: datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
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
