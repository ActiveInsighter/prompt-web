from __future__ import annotations

from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from scripts.collectors.tailwindcss_docs import collect, parse_page, parse_sidebar


SIDEBAR_HTML = """\
<html><body>
  <nav>
    <a href="/docs/installation">Documentation</a>
    <div data-autoscroll>
      <h3>Getting started</h3>
      <ul>
        <li><a href="/docs/installation">Installation</a></li>
        <li><a href="/docs/editor-setup">Editor setup</a></li>
      </ul>
    </div>
    <div data-autoscroll>
      <h3>Interactivity</h3>
      <ul><li><a href="/docs/will-change">will-change</a></li></ul>
    </div>
  </nav>
  <nav>
    <div data-autoscroll>
      <h3>Interactivity</h3>
      <a href="/docs/will-change">will-change</a>
    </div>
  </nav>
</body></html>
"""

PAGE_HTML = """\
<html><body>
  <nav>Sidebar noise</nav>
  <main>
    <p data-section="true">Interactivity</p>
    <h1 data-title="true">will-change</h1>
    <p data-description="true">Utilities for optimizing upcoming animations.</p>
    <div data-content="true">
      <table><thead><tr><th>Class</th><th>Styles</th></tr></thead>
      <tbody><tr><td><code>will-change-auto</code></td><td><code>will-change: auto;</code></td></tr></tbody></table>
      <h2>Examples</h2>
      <p>Use <code>will-change-scroll</code> shortly before an element changes.</p>
      <figure>
        <div>Rendered preview noise</div>
        <pre><code class="language-html">&lt;div class="will-change-scroll"&gt;&lt;/div&gt;</code></pre>
      </figure>
      <p aria-hidden="true">Hidden duplicate</p>
      <a href="/docs/user-select">user-select</a>
    </div>
  </main>
  <footer>Footer noise</footer>
</body></html>
"""

PROJECT_YAML = """\
schema_version: 1
id: project-tailwindcss-docs
slug: tailwindcss-docs
name: Tailwind CSS Docs
visibility: public
default_language: en-US
sync:
  enabled: true
  prune: true
"""


class TailwindCssDocsCollectorTests(unittest.TestCase):
    def test_parses_sidebar_groups_and_deduplicates_responsive_copies(self) -> None:
        documents = parse_sidebar(SIDEBAR_HTML, "https://tailwindcss.com/docs/will-change")
        self.assertEqual(
            [(item.group, item.title, item.relative_path) for item in documents],
            [
                ("Getting started", "Installation", "getting-started/installation.md"),
                ("Getting started", "Editor setup", "getting-started/editor-setup.md"),
                ("Interactivity", "will-change", "interactivity/will-change.md"),
            ],
        )

    def test_extracts_ai_readable_markdown_only_from_document_markers(self) -> None:
        page = parse_page(PAGE_HTML, "https://tailwindcss.com/docs/will-change")
        self.assertEqual(page.section, "Interactivity")
        self.assertIn("# will-change", page.markdown)
        self.assertIn("| Class | Styles |", page.markdown)
        self.assertIn("```html", page.markdown)
        self.assertIn('<div class="will-change-scroll"></div>', page.markdown)
        self.assertIn("https://tailwindcss.com/docs/user-select", page.markdown)
        self.assertNotIn("Rendered preview noise", page.markdown)
        self.assertNotIn("Hidden duplicate", page.markdown)
        self.assertNotIn("Footer noise", page.markdown)

    def test_collects_pages_folders_and_source_metadata(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            content_root = root / "content"
            project = content_root / "tailwindcss-docs"
            project.mkdir(parents=True)
            (project / "_project.yaml").write_text(PROJECT_YAML, encoding="utf-8")
            config = root / "collector.yaml"
            config.write_text(
                """\
start_url: https://tailwindcss.com/docs/will-change
project: tailwindcss-docs
include_groups: [Interactivity]
max_documents: 1
workers: 2
""",
                encoding="utf-8",
            )

            calls = 0

            def counted_request(_url: str, *_args: object) -> str:
                nonlocal calls
                calls += 1
                return SIDEBAR_HTML if calls == 1 else PAGE_HTML

            with patch("scripts.collectors.tailwindcss_docs._request_text", side_effect=counted_request):
                written = collect(config, content_root)

            self.assertEqual(len(written), 2)
            folder = (project / "interactivity" / "_folder.yaml").read_text(encoding="utf-8")
            document = (project / "interactivity" / "will-change.md").read_text(encoding="utf-8")
            self.assertIn("sidebar_label: Interactivity", folder)
            self.assertIn("source: https://tailwindcss.com/docs/will-change", document)
            self.assertIn("# will-change", document)


if __name__ == "__main__":
    unittest.main()
