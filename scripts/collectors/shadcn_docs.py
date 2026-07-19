from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path, PurePosixPath
import re
import tempfile
import time
from typing import Any
from urllib.parse import urljoin, urlsplit, urlunsplit
from urllib.request import Request, urlopen

import yaml

from .base import (
    CollectedDocument,
    atomic_write_document,
    safe_output_path,
    update_collector_inventory,
)


@dataclass(frozen=True)
class SidebarDocument:
    group: str
    title: str
    page_url: str
    markdown_url: str
    relative_path: str
    group_sort: int
    document_sort: int


class ShadcnSidebarParser(HTMLParser):
    """Extract the labelled groups and menu links from the docs sidebar."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.depth = 0
        self.sidebar_depth: int | None = None
        self.group_depth: int | None = None
        self.label_depth: int | None = None
        self.link_depth: int | None = None
        self.label_parts: list[str] = []
        self.link_parts: list[str] = []
        self.link_href = ""
        self.current_group = ""
        self.groups: list[tuple[str, list[tuple[str, str]]]] = []
        self.current_links: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        current_depth = self.depth
        self.depth += 1

        if tag == "div" and "data-docs-sidebar-content" in attributes:
            self.sidebar_depth = current_depth
            return
        if self.sidebar_depth is None:
            return
        if tag == "div" and attributes.get("data-sidebar") == "group":
            self.group_depth = current_depth
            self.current_group = ""
            self.current_links = []
        elif self.group_depth is not None and tag == "div" and attributes.get("data-sidebar") == "group-label":
            self.label_depth = current_depth
            self.label_parts = []
        elif self.group_depth is not None and tag == "a" and attributes.get("data-sidebar") == "menu-button":
            self.link_depth = current_depth
            self.link_href = attributes.get("href") or ""
            self.link_parts = []

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        # Sidebar markup currently has no relevant void elements. Keep depth
        # balanced if one is added later.
        self.handle_starttag(tag, attrs)
        self.depth -= 1

    def handle_data(self, data: str) -> None:
        if self.label_depth is not None:
            self.label_parts.append(data)
        if self.link_depth is not None:
            self.link_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        self.depth -= 1
        current_depth = self.depth

        if tag == "a" and self.link_depth == current_depth:
            title = " ".join("".join(self.link_parts).split())
            if title and self.link_href:
                self.current_links.append((title, self.link_href))
            self.link_depth = None
            self.link_href = ""
            self.link_parts = []
        if tag == "div" and self.label_depth == current_depth:
            self.current_group = " ".join("".join(self.label_parts).split())
            self.label_depth = None
            self.label_parts = []
        if tag == "div" and self.group_depth == current_depth:
            if self.current_group and self.current_links:
                self.groups.append((self.current_group, self.current_links))
            self.group_depth = None
            self.current_group = ""
            self.current_links = []
        if tag == "div" and self.sidebar_depth == current_depth:
            self.sidebar_depth = None


def _load_config(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    if not isinstance(value, dict):
        raise ValueError("Collector config root must be an object.")
    return value


def _slug(value: str) -> str:
    normalized = value.casefold().replace("@", "")
    slug = re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")
    if not slug:
        raise ValueError(f"Cannot create a safe path slug from sidebar label: {value!r}")
    return slug


def _markdown_url(page_url: str) -> str:
    parts = urlsplit(page_url)
    path = parts.path.rstrip("/")
    if not path.endswith(".md"):
        path += ".md"
    return urlunsplit((parts.scheme, parts.netloc, path, parts.query, ""))


def parse_sidebar(html: str, start_url: str, include_groups: set[str] | None = None) -> list[SidebarDocument]:
    parser = ShadcnSidebarParser()
    parser.feed(html)
    parser.close()
    if not parser.groups:
        raise ValueError("No shadcn docs sidebar groups were found; the upstream markup may have changed.")

    origin = urlsplit(start_url)
    group_slugs: set[str] = set()
    documents: list[SidebarDocument] = []
    for group_sort, (group, links) in enumerate(parser.groups, start=1):
        if include_groups is not None and group.casefold() not in include_groups:
            continue
        group_slug = _slug(group)
        if group_slug in group_slugs:
            raise ValueError(f"Duplicate sidebar group output path: {group_slug}")
        group_slugs.add(group_slug)
        filenames: set[str] = set()
        seen_urls: set[str] = set()
        for document_sort, (title, href) in enumerate(links, start=1):
            page_url = urljoin(start_url, href)
            parsed = urlsplit(page_url)
            if parsed.scheme not in {"http", "https"} or parsed.netloc != origin.netloc:
                continue
            if not (parsed.path == "/docs" or parsed.path.startswith("/docs/")):
                continue
            canonical_page_url = urlunsplit((parsed.scheme, parsed.netloc, parsed.path.rstrip("/") or "/", parsed.query, ""))
            if canonical_page_url in seen_urls:
                continue
            seen_urls.add(canonical_page_url)
            filename = f"{_slug(title)}.md"
            if filename.casefold() in filenames:
                raise ValueError(f"Duplicate document name in sidebar group {group!r}: {filename}")
            filenames.add(filename.casefold())
            documents.append(
                SidebarDocument(
                    group=group,
                    title=title,
                    page_url=canonical_page_url,
                    markdown_url=_markdown_url(canonical_page_url),
                    relative_path=PurePosixPath(group_slug, filename).as_posix(),
                    group_sort=group_sort,
                    document_sort=document_sort,
                )
            )
    if not documents:
        raise ValueError("The selected sidebar groups contain no same-origin /docs links.")
    return documents


def _request_text(url: str, timeout: float, user_agent: str, accept: str, retries: int) -> str:
    last_error: Exception | None = None
    for attempt in range(retries + 1):
        try:
            request = Request(url, headers={"User-Agent": user_agent, "Accept": accept})
            with urlopen(request, timeout=timeout) as response:
                charset = response.headers.get_content_charset() or "utf-8"
                return response.read().decode(charset)
        except Exception as error:  # urllib exposes several transport exception types.
            last_error = error
            if attempt < retries:
                time.sleep(min(2**attempt, 4))
    raise RuntimeError(f"Failed to fetch {url}: {last_error}") from last_error


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
    start_url = str(config.get("start_url", "")).strip()
    project = str(config.get("project", "")).strip()
    if not start_url.startswith(("https://", "http://")):
        raise ValueError("shadcn_docs collector requires an http(s) start_url.")
    if not project:
        raise ValueError("shadcn_docs collector requires a project directory name.")
    project_config = safe_output_path(content_root, project, "_project.yaml")
    if not project_config.is_file():
        raise ValueError(f"Collector project must already contain _project.yaml: {project_config.parent}")

    timeout = float(config.get("timeout_seconds", 30))
    retries = int(config.get("retries", 2))
    workers = int(config.get("workers", 8))
    if timeout <= 0 or retries < 0 or workers <= 0:
        raise ValueError("timeout_seconds and workers must be positive; retries cannot be negative.")
    user_agent = str(config.get("user_agent", "prompt-web-shadcn-docs-collector/1.0"))
    configured_groups = config.get("include_groups")
    if configured_groups is not None and (
        not isinstance(configured_groups, list)
        or not all(isinstance(group, str) and group.strip() for group in configured_groups)
    ):
        raise ValueError("include_groups must be a list of non-empty sidebar group labels.")
    include_groups = (
        {group.strip().casefold() for group in configured_groups}
        if configured_groups is not None
        else None
    )

    html = _request_text(start_url, timeout, user_agent, "text/html,*/*", retries)
    documents = parse_sidebar(html, start_url, include_groups)
    max_documents = config.get("max_documents")
    if max_documents is not None:
        if isinstance(max_documents, bool) or not isinstance(max_documents, int) or max_documents <= 0:
            raise ValueError("max_documents must be a positive integer when provided.")
        documents = documents[:max_documents]

    # Fetch everything before writing so a failed run does not leave a partially refreshed collection.
    content_by_url: dict[str, str] = {}
    unique_urls = list(dict.fromkeys(document.markdown_url for document in documents))
    errors: list[str] = []
    with ThreadPoolExecutor(max_workers=min(workers, len(unique_urls))) as executor:
        futures = {
            executor.submit(
                _request_text,
                url,
                timeout,
                user_agent,
                "text/markdown,text/plain,*/*",
                retries,
            ): url
            for url in unique_urls
        }
        for future in as_completed(futures):
            url = futures[future]
            try:
                content = future.result()
                if not content.strip() or content.lstrip().lower().startswith("<!doctype html"):
                    raise RuntimeError("response is empty or HTML instead of Markdown")
                content_by_url[url] = content
            except Exception as error:
                errors.append(f"{url}: {error}")
    if errors:
        details = "\n".join(f"- {error}" for error in sorted(errors))
        raise RuntimeError(f"Failed to download {len(errors)} shadcn Markdown document(s):\n{details}")

    written: list[Path] = []
    owned_paths: list[str] = []
    group_metadata_written: set[str] = set()
    for document in documents:
        group_slug = PurePosixPath(document.relative_path).parts[0]
        if group_slug not in group_metadata_written:
            folder_path = safe_output_path(content_root, project, f"{group_slug}/_folder.yaml")
            written.append(
                _atomic_write_yaml(
                    folder_path,
                    {
                        "id": f"shadcn-ui-docs-group-{group_slug}",
                        "sort": document.group_sort * 10,
                        "metadata": {"sidebar_label": document.group, "source": start_url},
                    },
                )
            )
            owned_paths.append(f"{group_slug}/_folder.yaml")
            group_metadata_written.add(group_slug)
        written.append(
            atomic_write_document(
                content_root,
                CollectedDocument(
                    project=project,
                    relative_path=document.relative_path,
                    content=content_by_url[document.markdown_url],
                    frontmatter={},
                ),
            )
        )
        owned_paths.append(document.relative_path)
    update_collector_inventory(
        content_root,
        project,
        ".shadcn-docs-collector.json",
        owned_paths,
        prune=bool(config.get("prune", False)),
        metadata={"start_url": start_url},
    )
    return written
