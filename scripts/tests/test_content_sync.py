from __future__ import annotations

import json
from pathlib import Path
import tempfile
import unittest

from scripts.library.models import ManifestValidationError
from scripts.library.scanner import ContentValidationError, scan_content


PROJECT_YAML = """\
schema_version: 1
id: project-test
slug: test
name: Test
description: Test project
visibility: public
default_language: zh-CN
sync:
  enabled: true
  prune: true
metadata:
  owner: tests
"""


class ContentScannerTests(unittest.TestCase):
    def test_builds_stable_manifest_and_discovers_variables(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            content = root / "content"
            project = content / "test"
            folder = project / "guides"
            folder.mkdir(parents=True)
            (project / "_project.yaml").write_text(PROJECT_YAML, encoding="utf-8")
            (folder / "_folder.yaml").write_text(
                "id: folder-test-guides\nsort: 10\n",
                encoding="utf-8",
            )
            (folder / "example.md").write_text(
                """\
---
id: file-test-example
title: 示例提示词
description: 用于测试内容扫描器
role: template
tags:
  - 测试
variables:
  - audience
---

# 示例

请面向 {{ audience }} 讲解 {{topic}}。
""",
                encoding="utf-8",
            )

            first = scan_content(content, root).to_dict()
            second = scan_content(content, root).to_dict()

            self.assertEqual(first["manifestHash"], second["manifestHash"])
            self.assertEqual(len(first["projects"]), 1)
            self.assertEqual(len(first["folders"]), 1)
            self.assertEqual(len(first["files"]), 1)
            document = first["files"][0]
            self.assertEqual(document["path"], "/guides/example.md")
            self.assertEqual(document["parentId"], "folder-test-guides")
            self.assertEqual(document["variables"], ["audience", "topic"])
            self.assertTrue(document["contentHash"].startswith("sha256:"))
            self.assertTrue(document["syncHash"].startswith("sha256:"))
            json.dumps(first, ensure_ascii=False)

    def test_rejects_case_insensitive_duplicate_paths(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            project = root / "content" / "test"
            project.mkdir(parents=True)
            (project / "_project.yaml").write_text(PROJECT_YAML, encoding="utf-8")
            (project / "A.md").write_text("# A\n", encoding="utf-8")
            (project / "a.md").write_text("# a\n", encoding="utf-8")

            with self.assertRaises(ContentValidationError):
                scan_content(root / "content", root)

    def test_requires_project_configuration(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            project = root / "content" / "test"
            project.mkdir(parents=True)
            (project / "example.md").write_text("# Example\n", encoding="utf-8")

            with self.assertRaises(ContentValidationError):
                scan_content(root / "content", root)

    def test_rejects_duplicate_node_id_between_folder_and_file(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            project = root / "content" / "test"
            folder = project / "guides"
            folder.mkdir(parents=True)
            (project / "_project.yaml").write_text(PROJECT_YAML, encoding="utf-8")
            (folder / "_folder.yaml").write_text(
                "id: shared-node-id\n",
                encoding="utf-8",
            )
            (folder / "example.md").write_text(
                "---\nid: shared-node-id\ntitle: Example\n---\n\n# Example\n",
                encoding="utf-8",
            )

            manifest = scan_content(root / "content", root)
            with self.assertRaises(ManifestValidationError):
                manifest.to_dict()

    def test_rejects_tags_that_cannot_round_trip_through_d1(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            project = root / "content" / "test"
            project.mkdir(parents=True)
            (project / "_project.yaml").write_text(PROJECT_YAML, encoding="utf-8")
            (project / "example.md").write_text(
                "---\nid: file-test-example\ntitle: Example\ntags: ['invalid,tag']\n---\n\n# Example\n",
                encoding="utf-8",
            )

            manifest = scan_content(root / "content", root)
            with self.assertRaisesRegex(ManifestValidationError, "cannot contain commas"):
                manifest.to_dict()

    def test_rejects_yaml_values_that_are_not_json_serializable(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            project = root / "content" / "test"
            project.mkdir(parents=True)
            (project / "_project.yaml").write_text(PROJECT_YAML, encoding="utf-8")
            (project / "example.md").write_text(
                "---\nid: file-test-example\ntitle: Example\npublished: 2026-07-19\n---\n\n# Example\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(ManifestValidationError, "JSON serializable"):
                scan_content(root / "content", root)


if __name__ == "__main__":
    unittest.main()
