from __future__ import annotations

from dataclasses import dataclass, field
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
