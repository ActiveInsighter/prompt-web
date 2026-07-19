from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path, PurePosixPath
import json
import os
import re
import tempfile
import time
from typing import Any
from urllib.parse import quote
from urllib.request import Request, urlopen

import yaml

from .base import (
    CollectedDocument,
    atomic_write_document,
    safe_output_path,
    update_collector_inventory,
)


def _load_config(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    if not isinstance(value, dict):
        raise ValueError("Collector config root must be an object.")
    return value


def _request_bytes(
    url: str,
    timeout: float,
    user_agent: str,
    retries: int,
    token: str = "",
    accept: str = "text/plain,*/*",
) -> bytes:
    headers = {"User-Agent": user_agent, "Accept": accept}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    last_error: Exception | None = None
    for attempt in range(retries + 1):
        try:
            with urlopen(Request(url, headers=headers), timeout=timeout) as response:
                return response.read()
        except Exception as error:  # urllib exposes several transport exception types.
            last_error = error
            if attempt < retries:
                time.sleep(min(2**attempt, 4))
    raise RuntimeError(f"Failed to fetch {url}: {last_error}") from last_error


def _request_json(
    url: str, timeout: float, user_agent: str, retries: int, token: str
) -> dict[str, Any]:
    raw = _request_bytes(
        url,
        timeout,
        user_agent,
        retries,
        token,
        "application/vnd.github+json",
    )
    try:
        value = json.loads(raw.decode("utf-8"))
    except (UnicodeError, json.JSONDecodeError) as error:
        raise RuntimeError(f"GitHub API returned invalid JSON for {url}: {error}") from error
    if not isinstance(value, dict):
        raise RuntimeError(f"GitHub API returned a non-object response for {url}")
    return value


def discover_documents(
    tree: dict[str, Any], source_directory: str, extensions: set[str]
) -> list[str]:
    entries = tree.get("tree")
    if not isinstance(entries, list):
        raise ValueError("GitHub tree response does not contain a tree list.")
    prefix = source_directory.strip("/") + "/"
    documents: list[str] = []
    for entry in entries:
        if not isinstance(entry, dict) or entry.get("type") != "blob":
            continue
        path = entry.get("path")
        if not isinstance(path, str) or not path.startswith(prefix):
            continue
        if PurePosixPath(path).suffix.casefold() in extensions:
            documents.append(path)
    documents.sort(key=str.casefold)
    if not documents:
        raise ValueError(f"No matching documents found under {source_directory!r}.")
    return documents


def _folder_id(relative_directory: PurePosixPath) -> str:
    suffix = re.sub(r"[^a-z0-9]+", "-", relative_directory.as_posix().casefold()).strip("-")
    return f"zustand-docs-folder-{suffix}"


def _atomic_write_yaml(destination: Path, value: dict[str, Any]) -> Path:
    destination.parent.mkdir(parents=True, exist_ok=True)
    rendered = yaml.safe_dump(value, allow_unicode=True, sort_keys=False).rstrip() + "\n"
    with tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", newline="\n", dir=destination.parent, delete=False
    ) as handle:
        handle.write(rendered)
        temporary = Path(handle.name)
    temporary.replace(destination)
    return destination


def collect(config_path: Path, content_root: Path) -> list[Path]:
    config = _load_config(config_path)
    owner = str(config.get("owner", "")).strip()
    repository = str(config.get("repository", "")).strip()
    ref = str(config.get("ref", "main")).strip()
    source_directory = str(config.get("source_directory", "docs")).strip("/")
    project = str(config.get("project", "")).strip()
    if not all((owner, repository, ref, source_directory, project)):
        raise ValueError(
            "zustand_docs collector requires owner, repository, ref, source_directory and project."
        )
    project_config = safe_output_path(content_root, project, "_project.yaml")
    if not project_config.is_file():
        raise ValueError(f"Collector project must already contain _project.yaml: {project_config.parent}")

    timeout = float(config.get("timeout_seconds", 30))
    retries = int(config.get("retries", 2))
    workers = int(config.get("workers", 8))
    if timeout <= 0 or retries < 0 or workers <= 0:
        raise ValueError("timeout_seconds and workers must be positive; retries cannot be negative.")
    extensions_value = config.get("extensions", [".md", ".mdx"])
    if not isinstance(extensions_value, list) or not all(
        isinstance(extension, str) and extension.startswith(".") for extension in extensions_value
    ):
        raise ValueError("extensions must be a list such as ['.md', '.mdx'].")
    extensions = {extension.casefold() for extension in extensions_value}
    user_agent = str(config.get("user_agent", "prompt-web-zustand-docs-collector/1.0"))
    token_env = str(config.get("token_env", "GITHUB_TOKEN")).strip()
    token = os.environ.get(token_env, "") if token_env else ""

    api_base = f"https://api.github.com/repos/{quote(owner)}/{quote(repository)}"
    commit = _request_json(
        f"{api_base}/commits/{quote(ref, safe='')}", timeout, user_agent, retries, token
    )
    commit_sha = commit.get("sha")
    if not isinstance(commit_sha, str) or not re.fullmatch(r"[0-9a-f]{40}", commit_sha):
        raise RuntimeError("GitHub commit response does not contain a valid SHA.")
    tree = _request_json(
        f"{api_base}/git/trees/{commit_sha}?recursive=1", timeout, user_agent, retries, token
    )
    if tree.get("truncated") is True:
        raise RuntimeError("GitHub recursive tree response was truncated; refusing a partial sync.")
    source_paths = discover_documents(tree, source_directory, extensions)

    prefix = source_directory + "/"
    relative_by_source: dict[str, str] = {}
    raw_url_by_source: dict[str, str] = {}
    for source_path in source_paths:
        relative = PurePosixPath(source_path.removeprefix(prefix))
        if relative.suffix.casefold() == ".mdx":
            relative = relative.with_suffix(".md")
        relative_by_source[source_path] = relative.as_posix()
        encoded_path = "/".join(quote(part, safe="") for part in PurePosixPath(source_path).parts)
        raw_url_by_source[source_path] = (
            f"https://raw.githubusercontent.com/{quote(owner)}/{quote(repository)}/{commit_sha}/{encoded_path}"
        )
    casefold_paths = [path.casefold() for path in relative_by_source.values()]
    if len(casefold_paths) != len(set(casefold_paths)):
        raise ValueError("Source documents map to duplicate case-insensitive output paths.")

    content_by_source: dict[str, str] = {}
    errors: list[str] = []
    with ThreadPoolExecutor(max_workers=min(workers, len(source_paths))) as executor:
        futures = {
            executor.submit(
                _request_bytes,
                raw_url_by_source[source_path],
                timeout,
                user_agent,
                retries,
                token,
            ): source_path
            for source_path in source_paths
        }
        for future in as_completed(futures):
            source_path = futures[future]
            try:
                content = future.result().decode("utf-8")
                if not content.strip():
                    raise RuntimeError("document is empty")
                content_by_source[source_path] = content
            except Exception as error:
                errors.append(f"{source_path}: {error}")
    if errors:
        details = "\n".join(f"- {error}" for error in sorted(errors))
        raise RuntimeError(f"Failed to download {len(errors)} Zustand document(s):\n{details}")

    directories = sorted(
        {
            parent
            for relative_path in relative_by_source.values()
            for parent in PurePosixPath(relative_path).parents
            if parent != PurePosixPath(".")
        },
        key=lambda path: (len(path.parts), path.as_posix().casefold()),
    )
    written: list[Path] = []
    owned_paths: list[str] = []
    for sort, directory in enumerate(directories, start=1):
        relative_folder_config = (directory / "_folder.yaml").as_posix()
        folder_config = safe_output_path(content_root, project, relative_folder_config)
        written.append(
            _atomic_write_yaml(
                folder_config,
                {
                    "id": _folder_id(directory),
                    "sort": sort * 10,
                    "metadata": {
                        "source": f"https://github.com/{owner}/{repository}/tree/{ref}/{source_directory}/{directory.as_posix()}"
                    },
                },
            )
        )
        owned_paths.append(relative_folder_config)
    for source_path in source_paths:
        relative_path = relative_by_source[source_path]
        written.append(
            atomic_write_document(
                content_root,
                CollectedDocument(
                    project=project,
                    relative_path=relative_path,
                    content=content_by_source[source_path],
                    frontmatter={},
                ),
            )
        )
        owned_paths.append(relative_path)

    update_collector_inventory(
        content_root,
        project,
        ".zustand-docs-collector.json",
        owned_paths,
        prune=bool(config.get("prune", False)),
        metadata={
            "repository": f"{owner}/{repository}",
            "ref": ref,
            "commit": commit_sha,
            "source_directory": source_directory,
        },
    )
    return written
