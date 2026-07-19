from __future__ import annotations

from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from scripts.collectors.base import update_collector_inventory
from scripts.collectors.zustand_docs import collect, discover_documents


PROJECT_YAML = """\
schema_version: 1
id: project-zustand-docs
slug: zustand-docs
name: Zustand Docs
visibility: public
default_language: en-US
sync:
  enabled: true
  prune: true
"""


TREE = {
    "sha": "b" * 40,
    "truncated": False,
    "tree": [
        {"path": "docs/index.md", "type": "blob"},
        {"path": "docs/learn/guide.md", "type": "blob"},
        {"path": "docs/example.mdx", "type": "blob"},
        {"path": "docs/logo.jpg", "type": "blob"},
        {"path": "src/index.ts", "type": "blob"},
        {"path": "docs/learn", "type": "tree"},
    ],
}


class ZustandDocsCollectorTests(unittest.TestCase):
    def test_discovers_only_configured_document_extensions(self) -> None:
        self.assertEqual(
            discover_documents(TREE, "docs", {".md", ".mdx"}),
            ["docs/example.mdx", "docs/index.md", "docs/learn/guide.md"],
        )

    def test_collects_repository_tree_and_converts_mdx_extension(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            content_root = root / "content"
            project = content_root / "zustand-docs"
            project.mkdir(parents=True)
            (project / "_project.yaml").write_text(PROJECT_YAML, encoding="utf-8")
            config = root / "collector.yaml"
            config.write_text(
                """\
owner: pmndrs
repository: zustand
ref: main
source_directory: docs
project: zustand-docs
extensions: [.md, .mdx]
workers: 2
prune: true
""",
                encoding="utf-8",
            )

            api_responses = [{"sha": "a" * 40}, TREE]

            def fake_bytes(url: str, *_args: object, **_kwargs: object) -> bytes:
                filename = url.rsplit("/", 1)[-1]
                return f"# {filename}\n".encode()

            with (
                patch("scripts.collectors.zustand_docs._request_json", side_effect=api_responses),
                patch("scripts.collectors.zustand_docs._request_bytes", side_effect=fake_bytes),
            ):
                written = collect(config, content_root)

            self.assertEqual(len(written), 4)
            self.assertTrue((project / "index.md").is_file())
            self.assertTrue((project / "example.md").is_file())
            self.assertTrue((project / "learn" / "guide.md").is_file())
            self.assertIn(
                "zustand-docs-folder-learn",
                (project / "learn" / "_folder.yaml").read_text(encoding="utf-8"),
            )
            self.assertTrue((project / ".zustand-docs-collector.json").is_file())

    def test_inventory_prunes_only_previously_owned_files(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            content_root = Path(temporary) / "content"
            project = content_root / "zustand-docs"
            project.mkdir(parents=True)
            (project / "old.md").write_text("# Old\n", encoding="utf-8")
            (project / "keep.md").write_text("# Keep\n", encoding="utf-8")
            (project / "unmanaged.md").write_text("# Unmanaged\n", encoding="utf-8")

            update_collector_inventory(
                content_root,
                "zustand-docs",
                ".inventory.json",
                ["old.md", "keep.md"],
                prune=True,
            )
            removed = update_collector_inventory(
                content_root,
                "zustand-docs",
                ".inventory.json",
                ["keep.md"],
                prune=True,
            )

            self.assertEqual(removed, [project / "old.md"])
            self.assertFalse((project / "old.md").exists())
            self.assertTrue((project / "keep.md").is_file())
            self.assertTrue((project / "unmanaged.md").is_file())


if __name__ == "__main__":
    unittest.main()
