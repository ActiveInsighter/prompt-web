from __future__ import annotations

from dataclasses import dataclass, field
import json
from pathlib import Path, PurePosixPath
import tempfile
from typing import Any

import yaml


@dataclass(frozen=True)
class CollectedDocument:
    project: str
    relative_path: str
    content: str
    frontmatter: dict[str, Any] = field(default_factory=dict)


def safe_output_path(content_root: Path, project: str, relative_path: str) -> Path:
    relative = PurePosixPath(relative_path)
    if relative.is_absolute() or ".." in relative.parts:
        raise ValueError(f"Collector output path escapes content root: {relative_path}")
    if not project or "/" in project or "\\" in project or project in {".", ".."}:
        raise ValueError(f"Invalid collector project directory: {project}")
    output = (content_root / project / Path(*relative.parts)).resolve()
    project_root = (content_root / project).resolve()
    if output != project_root and project_root not in output.parents:
        raise ValueError(f"Collector output path escapes project: {relative_path}")
    return output


def render_document(document: CollectedDocument) -> str:
    content = document.content.replace("\r\n", "\n").replace("\r", "\n").rstrip() + "\n"
    if not document.frontmatter:
        return content
    header = yaml.safe_dump(
        document.frontmatter,
        allow_unicode=True,
        sort_keys=False,
        default_flow_style=False,
    ).rstrip()
    return f"---\n{header}\n---\n\n{content}"


def atomic_write_document(content_root: Path, document: CollectedDocument) -> Path:
    destination = safe_output_path(content_root, document.project, document.relative_path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    rendered = render_document(document)
    with tempfile.NamedTemporaryFile(
        "w",
        encoding="utf-8",
        newline="\n",
        dir=destination.parent,
        delete=False,
    ) as handle:
        handle.write(rendered)
        temporary = Path(handle.name)
    temporary.replace(destination)
    return destination


def update_collector_inventory(
    content_root: Path,
    project: str,
    inventory_name: str,
    relative_paths: list[str],
    *,
    prune: bool,
    metadata: dict[str, Any] | None = None,
) -> list[Path]:
    """Record collector-owned files and optionally remove stale owned files.

    The hidden inventory is ignored by the content scanner. Only paths recorded
    by the same collector on a previous successful run are eligible for removal.
    """

    if not inventory_name.startswith(".") or "/" in inventory_name or "\\" in inventory_name:
        raise ValueError("Collector inventory name must be a hidden file in the project root.")
    inventory_path = safe_output_path(content_root, project, inventory_name)
    current_paths = sorted(dict.fromkeys(relative_paths))
    for relative_path in current_paths:
        safe_output_path(content_root, project, relative_path)

    previous_paths: list[str] = []
    if inventory_path.is_file():
        try:
            previous = json.loads(inventory_path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError) as error:
            raise ValueError(f"Cannot read collector inventory {inventory_path}: {error}") from error
        raw_paths = previous.get("paths") if isinstance(previous, dict) else None
        if not isinstance(raw_paths, list) or not all(isinstance(path, str) for path in raw_paths):
            raise ValueError(f"Invalid collector inventory paths: {inventory_path}")
        previous_paths = raw_paths

    removed: list[Path] = []
    if prune:
        stale_paths = sorted(set(previous_paths) - set(current_paths), reverse=True)
        project_root = (content_root / project).resolve()
        for relative_path in stale_paths:
            destination = safe_output_path(content_root, project, relative_path)
            if destination.is_file():
                destination.unlink()
                removed.append(destination)
            parent = destination.parent
            while parent != project_root and project_root in parent.parents:
                try:
                    parent.rmdir()
                except OSError:
                    break
                parent = parent.parent

    payload = {"version": 1, "paths": current_paths, "metadata": metadata or {}}
    inventory_path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", newline="\n", dir=inventory_path.parent, delete=False
    ) as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2, sort_keys=True)
        handle.write("\n")
        temporary = Path(handle.name)
    temporary.replace(inventory_path)
    return removed
