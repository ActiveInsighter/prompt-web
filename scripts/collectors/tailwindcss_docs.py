from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
import re
import tempfile
import time
from typing import Any
from urllib.parse import urljoin, urlsplit, urlunsplit
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup, NavigableString, Tag
from markdownify import markdownify as html_to_markdown
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
    relative_path: str
    group_sort: int
    document_sort: int


@dataclass(frozen=True)
class ParsedPage:
    section: str
    title: str
    description: str
    markdown: str


def _load_config(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    if not isinstance(value, dict):
        raise ValueError("Collector config root must be an object.")
    return value


def _slug(value: str) -> str:
    normalized = value.casefold().replace("&", " and ").replace("@", "")
    slug = re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")
    if not slug:
        raise ValueError(f"Cannot create a safe path slug from {value!r}")
    return slug


def _canonical_page_url(start_url: str, href: str) -> str | None:
    absolute = urljoin(start_url, href)
    origin = urlsplit(start_url)
    parsed = urlsplit(absolute)
    if parsed.scheme not in {"http", "https"} or parsed.netloc != origin.netloc:
        return None
    path = parsed.path.rstrip("/") or "/"
    if not path.startswith("/docs/"):
        return None
    return urlunsplit((parsed.scheme, parsed.netloc, path, "", ""))


def _relative_document_path(group_slug: str, page_url: str) -> str:
    path = urlsplit(page_url).path.removeprefix("/docs/").strip("/")
    parts = [_slug(part) for part in PurePosixPath(path).parts if part not in {"", "."}]
    if not parts:
        raise ValueError(f"Cannot derive a document path from {page_url}")
    return PurePosixPath(group_slug, *parts[:-1], f"{parts[-1]}.md").as_posix()


def parse_sidebar(
    html: str,
    start_url: str,
    include_groups: set[str] | None = None,
) -> list[SidebarDocument]:
    """Read Tailwind's rendered docs sidebar using stable data-autoscroll groups."""

    soup = BeautifulSoup(html, "html.parser")
    documents: list[SidebarDocument] = []
    seen_urls: set[str] = set()
    seen_paths: set[str] = set()
    group_order: dict[str, int] = {}

    for group_node in soup.select("nav [data-autoscroll]"):
        heading = group_node.find(["h2", "h3", "h4"], recursive=False)
        if heading is None:
            heading = group_node.find(["h2", "h3", "h4"])
        if heading is None:
            continue
        group = " ".join(heading.get_text(" ", strip=True).split())
        if not group:
            continue
        group_key = group.casefold()
        if include_groups is not None and group_key not in include_groups:
            continue
        if group_key not in group_order:
            group_order[group_key] = len(group_order) + 1
        group_sort = group_order[group_key]
        group_slug = _slug(group)

        document_sort = 0
        for link in group_node.find_all("a", href=True):
            page_url = _canonical_page_url(start_url, str(link["href"]))
            if page_url is None or page_url in seen_urls:
                continue
            title = " ".join(link.get_text(" ", strip=True).split())
            if not title:
                continue
            relative_path = _relative_document_path(group_slug, page_url)
            folded_path = relative_path.casefold()
            if folded_path in seen_paths:
                raise ValueError(f"Duplicate case-insensitive output path: {relative_path}")
            seen_urls.add(page_url)
            seen_paths.add(folded_path)
            document_sort += 1
            documents.append(
                SidebarDocument(
                    group=group,
                    title=title,
                    page_url=page_url,
                    relative_path=relative_path,
                    group_sort=group_sort,
                    document_sort=document_sort,
                )
            )

    if not documents:
        raise ValueError(
            "No Tailwind docs links were found under nav [data-autoscroll]; "
            "the upstream sidebar markup may have changed."
        )
    return documents


def _is_visually_hidden(tag: Tag) -> bool:
    if tag.has_attr("hidden") or str(tag.get("aria-hidden", "")).casefold() == "true":
        return True
    classes = {str(value).casefold() for value in tag.get("class", [])}
    return "sr-only" in classes or "hidden" in classes


def _code_language(element: Tag) -> str | None:
    candidates: list[Tag] = [element]
    code = element.find("code")
    if isinstance(code, Tag):
        candidates.append(code)
    for candidate in candidates:
        for class_name in candidate.get("class", []):
            match = re.match(r"(?:language|lang)-([A-Za-z0-9_+-]+)$", str(class_name))
            if match:
                return match.group(1)
    return None


def _clean_content(content: Tag, page_url: str) -> None:
    for tag in list(
        content.find_all(
            ["script", "style", "svg", "button", "template", "noscript", "iframe", "canvas"]
        )
    ):
        tag.decompose()
    for tag in list(content.find_all(_is_visually_hidden)):
        tag.decompose()

    # Figure previews are designed for humans and contain a great deal of duplicate
    # layout/image markup. Keep only their actual code samples and captions.
    for figure in list(content.find_all("figure")):
        preserved = BeautifulSoup("<div></div>", "html.parser").div
        assert preserved is not None
        caption = figure.find("figcaption")
        if isinstance(caption, Tag):
            preserved.append(caption.extract())
        for pre in list(figure.find_all("pre")):
            preserved.append(pre.extract())
        if preserved.contents:
            figure.replace_with(preserved)
        else:
            figure.decompose()

    for image in list(content.find_all("img")):
        alt = " ".join(str(image.get("alt", "")).split())
        if alt:
            image.replace_with(NavigableString(f"Image: {alt}"))
        else:
            image.decompose()

    for link in content.find_all("a", href=True):
        href = str(link["href"]).strip()
        if href and not href.startswith(("#", "mailto:", "tel:", "javascript:")):
            link["href"] = urljoin(page_url, href)


def _normalize_markdown(value: str) -> str:
    value = value.replace("\r\n", "\n").replace("\r", "\n")
    value = re.sub(r"[ \t]+\n", "\n", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def parse_page(html: str, page_url: str) -> ParsedPage:
    soup = BeautifulSoup(html, "html.parser")
    section_node = soup.find(attrs={"data-section": "true"})
    title_node = soup.find(attrs={"data-title": "true"})
    description_node = soup.find(attrs={"data-description": "true"})
    content_node = soup.find(attrs={"data-content": "true"})
    if not all(isinstance(node, Tag) for node in (title_node, description_node, content_node)):
        raise ValueError(
            f"Missing Tailwind page markers on {page_url}; expected data-title, "
            "data-description and data-content."
        )

    section = (
        " ".join(section_node.get_text(" ", strip=True).split())
        if isinstance(section_node, Tag)
        else "Documentation"
    )
    title = " ".join(title_node.get_text(" ", strip=True).split())
    description = " ".join(description_node.get_text(" ", strip=True).split())
    if not title or not description:
        raise ValueError(f"Tailwind page has an empty title or description: {page_url}")

    content = BeautifulSoup(str(content_node), "html.parser").find(attrs={"data-content": "true"})
    if not isinstance(content, Tag):
        raise ValueError(f"Cannot clone Tailwind content node: {page_url}")
    _clean_content(content, page_url)
    rendered = html_to_markdown(
        str(content),
        heading_style="ATX",
        bullets="-",
        code_language_callback=_code_language,
    )
    body = _normalize_markdown(rendered)
    if len(re.sub(r"\s+", "", body)) < 40:
        raise ValueError(f"Extracted Tailwind document is unexpectedly short: {page_url}")

    markdown = f"# {title}\n\n{description}\n\n{body}\n"
    return ParsedPage(section=section, title=title, description=description, markdown=markdown)


def _request_text(url: str, timeout: float, user_agent: str, retries: int) -> str:
    last_error: Exception | None = None
    for attempt in range(retries + 1):
        try:
            request = Request(
                url,
                headers={
                    "User-Agent": user_agent,
                    "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
                },
            )
            with urlopen(request, timeout=timeout) as response:
                content_type = response.headers.get_content_type()
                if content_type not in {"text/html", "application/xhtml+xml"}:
                    raise RuntimeError(f"unexpected content type {content_type!r}")
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


def _folder_id(path: PurePosixPath) -> str:
    return f"tailwindcss-docs-folder-{_slug(path.as_posix())}"


def collect(config_path: Path, content_root: Path) -> list[Path]:
    config = _load_config(config_path)
    start_url = str(config.get("start_url", "")).strip()
    project = str(config.get("project", "")).strip()
    if not start_url.startswith(("https://", "http://")):
        raise ValueError("tailwindcss_docs collector requires an http(s) start_url.")
    if not project:
        raise ValueError("tailwindcss_docs collector requires a project directory name.")
    project_config = safe_output_path(content_root, project, "_project.yaml")
    if not project_config.is_file():
        raise ValueError(f"Collector project must already contain _project.yaml: {project_config.parent}")

    timeout = float(config.get("timeout_seconds", 30))
    retries = int(config.get("retries", 2))
    workers = int(config.get("workers", 8))
    if timeout <= 0 or retries < 0 or workers <= 0:
        raise ValueError("timeout_seconds and workers must be positive; retries cannot be negative.")
    user_agent = str(config.get("user_agent", "prompt-web-tailwindcss-docs-collector/1.0"))
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

    sidebar_html = _request_text(start_url, timeout, user_agent, retries)
    documents = parse_sidebar(sidebar_html, start_url, include_groups)
    max_documents = config.get("max_documents")
    if max_documents is not None:
        if isinstance(max_documents, bool) or not isinstance(max_documents, int) or max_documents <= 0:
            raise ValueError("max_documents must be a positive integer when provided.")
        documents = documents[:max_documents]

    parsed_by_url: dict[str, ParsedPage] = {}
    errors: list[str] = []
    with ThreadPoolExecutor(max_workers=min(workers, len(documents))) as executor:
        futures = {
            executor.submit(_request_text, document.page_url, timeout, user_agent, retries): document
            for document in documents
        }
        for future in as_completed(futures):
            document = futures[future]
            try:
                parsed_by_url[document.page_url] = parse_page(future.result(), document.page_url)
            except Exception as error:
                errors.append(f"{document.page_url}: {error}")
    if errors:
        details = "\n".join(f"- {error}" for error in sorted(errors))
        raise RuntimeError(f"Failed to collect {len(errors)} Tailwind document(s):\n{details}")

    written: list[Path] = []
    owned_paths: list[str] = []

    directory_order: dict[PurePosixPath, tuple[int, int]] = {}
    group_labels: dict[str, str] = {}
    for document in documents:
        relative = PurePosixPath(document.relative_path)
        group_labels[relative.parts[0]] = document.group
        for directory in relative.parents:
            if directory == PurePosixPath("."):
                continue
            current = directory_order.get(directory)
            order = (document.group_sort, document.document_sort)
            if current is None or order < current:
                directory_order[directory] = order

    for directory in sorted(
        directory_order,
        key=lambda item: (len(item.parts), directory_order[item], item.as_posix()),
    ):
        group_slug = directory.parts[0]
        group_sort, document_sort = directory_order[directory]
        relative_config = (directory / "_folder.yaml").as_posix()
        metadata: dict[str, Any] = {"source": start_url}
        if len(directory.parts) == 1:
            metadata["sidebar_label"] = group_labels[group_slug]
        written.append(
            _atomic_write_yaml(
                safe_output_path(content_root, project, relative_config),
                {
                    "id": _folder_id(directory),
                    "sort": group_sort * 1000 + (document_sort if len(directory.parts) > 1 else 0),
                    "metadata": metadata,
                },
            )
        )
        owned_paths.append(relative_config)

    for document in documents:
        parsed = parsed_by_url[document.page_url]
        written.append(
            atomic_write_document(
                content_root,
                CollectedDocument(
                    project=project,
                    relative_path=document.relative_path,
                    content=parsed.markdown,
                    frontmatter={
                        "title": parsed.title,
                        "description": parsed.description,
                        "language": "en-US",
                        "role": "reference",
                        "tags": ["tailwindcss", _slug(parsed.section)],
                        "sort": document.document_sort * 10,
                        "metadata": {
                            "source": document.page_url,
                            "sidebar_group": document.group,
                            "section": parsed.section,
                            "collector": "rendered-html",
                        },
                    },
                ),
            )
        )
        owned_paths.append(document.relative_path)

    update_collector_inventory(
        content_root,
        project,
        ".tailwindcss-docs-collector.json",
        owned_paths,
        prune=bool(config.get("prune", False)),
        metadata={"start_url": start_url, "documents": len(documents)},
    )
    return written
