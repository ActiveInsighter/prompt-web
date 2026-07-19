from __future__ import annotations

from pathlib import Path
from typing import Any
from urllib.request import Request, urlopen

import yaml

from .base import CollectedDocument, atomic_write_document


def _load_config(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    if not isinstance(value, dict):
        raise ValueError("Collector config root must be an object.")
    return value


def collect(config_path: Path, content_root: Path) -> list[Path]:
    config = _load_config(config_path)
    documents = config.get("documents")
    if not isinstance(documents, list) or not documents:
        raise ValueError("http_markdown collector requires a non-empty documents list.")

    timeout = float(config.get("timeout_seconds", 30))
    user_agent = str(config.get("user_agent", "prompt-web-content-collector/1.0"))
    written: list[Path] = []

    for item in documents:
        if not isinstance(item, dict):
            raise ValueError("Each collector document must be an object.")
        url = str(item.get("url", "")).strip()
        project = str(item.get("project", "")).strip()
        relative_path = str(item.get("path", "")).strip()
        frontmatter = item.get("frontmatter") or {}
        if not url.startswith(("https://", "http://")):
            raise ValueError(f"Unsupported collector URL: {url}")
        if not isinstance(frontmatter, dict):
            raise ValueError(f"frontmatter must be an object for {url}")

        request = Request(url, headers={"User-Agent": user_agent, "Accept": "text/markdown,text/plain,*/*"})
        with urlopen(request, timeout=timeout) as response:
            charset = response.headers.get_content_charset() or "utf-8"
            content = response.read().decode(charset)

        written.append(
            atomic_write_document(
                content_root,
                CollectedDocument(
                    project=project,
                    relative_path=relative_path,
                    content=content,
                    frontmatter=frontmatter,
                ),
            )
        )

    return written
