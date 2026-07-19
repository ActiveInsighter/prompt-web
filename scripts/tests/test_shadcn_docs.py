from __future__ import annotations

from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from scripts.collectors.shadcn_docs import collect, parse_sidebar


SIDEBAR_HTML = """\
<html><body>
  <div data-docs-sidebar-content>
    <div data-sidebar="group">
      <div data-sidebar="group-label">Components</div>
      <div data-sidebar="group-content"><ul>
        <li><a data-sidebar="menu-button" href="/docs/components/base/button"><span></span>Button</a></li>
        <li><a data-sidebar="menu-button" href="/docs/components/base/alert-dialog">Alert Dialog<span title="New"></span></a></li>
      </ul></div>
    </div>
    <div data-sidebar="group">
      <div data-sidebar="group-label">Get Started</div>
      <div data-sidebar="group-content"><ul>
        <li><a data-sidebar="menu-button" href="/docs/installation">Installation</a></li>
        <li><a data-sidebar="menu-button" href="/llms.txt">llms.txt</a></li>
        <li><a data-sidebar="menu-button" href="https://example.com/docs/nope">External</a></li>
      </ul></div>
    </div>
  </div>
</body></html>
"""


PROJECT_YAML = """\
schema_version: 1
id: project-shadcn-ui-docs
slug: shadcn-ui-docs
name: shadcn/ui Docs
visibility: public
default_language: en-US
sync:
  enabled: true
  prune: false
"""


class ShadcnDocsCollectorTests(unittest.TestCase):
    def test_parses_groups_names_and_markdown_urls(self) -> None:
        documents = parse_sidebar(
            SIDEBAR_HTML,
            "https://ui.shadcn.com/docs/components/base/button",
        )

        self.assertEqual(
            [(item.group, item.title, item.relative_path) for item in documents],
            [
                ("Components", "Button", "components/button.md"),
                ("Components", "Alert Dialog", "components/alert-dialog.md"),
                ("Get Started", "Installation", "get-started/installation.md"),
            ],
        )
        self.assertEqual(
            documents[0].markdown_url,
            "https://ui.shadcn.com/docs/components/base/button.md",
        )

    def test_filters_groups_case_insensitively(self) -> None:
        documents = parse_sidebar(
            SIDEBAR_HTML,
            "https://ui.shadcn.com/docs/components/base/button",
            {"components"},
        )
        self.assertEqual([item.title for item in documents], ["Button", "Alert Dialog"])

    def test_collects_atomically_into_the_configured_project(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            content_root = root / "content"
            project = content_root / "shadcn-ui-docs"
            project.mkdir(parents=True)
            (project / "_project.yaml").write_text(PROJECT_YAML, encoding="utf-8")
            config = root / "collector.yaml"
            config.write_text(
                """\
start_url: https://ui.shadcn.com/docs/components/base/button
project: shadcn-ui-docs
include_groups: [Components]
workers: 2
max_documents: 1
""",
                encoding="utf-8",
            )

            def fake_request(url: str, *_args: object) -> str:
                if url.endswith("/button"):
                    return SIDEBAR_HTML
                return "---\ntitle: Button\n---\n\n# Button\n"

            with patch("scripts.collectors.shadcn_docs._request_text", side_effect=fake_request):
                written = collect(config, content_root)

            self.assertEqual(len(written), 2)
            self.assertIn("sidebar_label: Components", (project / "components" / "_folder.yaml").read_text(encoding="utf-8"))
            self.assertEqual(
                (project / "components" / "button.md").read_text(encoding="utf-8"),
                "---\ntitle: Button\n---\n\n# Button\n",
            )


if __name__ == "__main__":
    unittest.main()
