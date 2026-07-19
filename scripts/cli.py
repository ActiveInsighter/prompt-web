from __future__ import annotations

import argparse
import importlib
import json
from pathlib import Path
import sys
from typing import Any

from scripts.library.models import ContentManifest
from scripts.library.scanner import ContentValidationError, scan_content, summary
from scripts.sync.client import ContentSyncClient, ContentSyncClientError


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONTENT_ROOT = REPOSITORY_ROOT / "content"
DEFAULT_MANIFEST_PATH = REPOSITORY_ROOT / ".prompt-sync" / "manifest.json"


def _build_manifest(content_root: Path) -> ContentManifest:
    return scan_content(content_root, REPOSITORY_ROOT)


def _write_manifest(manifest: ContentManifest, destination: Path) -> dict[str, Any]:
    payload = manifest.to_dict()
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(destination.suffix + ".tmp")
    temporary.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    temporary.replace(destination)
    return payload


def _print_json(value: Any) -> None:
    print(json.dumps(value, ensure_ascii=False, indent=2))


def command_validate(args: argparse.Namespace) -> int:
    manifest = _build_manifest(args.content_root)
    print(f"Content validation succeeded: {summary(manifest)}")
    return 0


def command_build(args: argparse.Namespace) -> int:
    manifest = _build_manifest(args.content_root)
    payload = _write_manifest(manifest, args.manifest)
    print(
        f"Wrote {args.manifest}: projects={len(payload['projects'])} "
        f"folders={len(payload['folders'])} files={len(payload['files'])} "
        f"manifest={payload['manifestHash']}"
    )
    return 0


def _client(args: argparse.Namespace) -> ContentSyncClient:
    return ContentSyncClient.from_environment(args.base_url, args.token_env)


def command_plan(args: argparse.Namespace) -> int:
    payload = _write_manifest(_build_manifest(args.content_root), args.manifest)
    _print_json(_client(args).plan(payload, prune=args.prune))
    return 0


def command_sync(args: argparse.Namespace) -> int:
    payload = _write_manifest(_build_manifest(args.content_root), args.manifest)
    _print_json(_client(args).sync(payload, prune=args.prune))
    return 0


def command_snapshot(args: argparse.Namespace) -> int:
    _print_json(_client(args).snapshot())
    return 0


def command_collect(args: argparse.Namespace) -> int:
    module_name = args.collector.replace("-", "_")
    module = importlib.import_module(f"scripts.collectors.{module_name}")
    collect = getattr(module, "collect", None)
    if not callable(collect):
        raise RuntimeError(f"Collector scripts.collectors.{module_name} has no collect() function.")
    written = collect(args.config.resolve(), args.content_root.resolve())
    for path in written:
        print(path.relative_to(REPOSITORY_ROOT))
    print(f"Collector {args.collector} wrote {len(written)} document(s).")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Validate, build and synchronize the prompt content library."
    )
    parser.add_argument(
        "--content-root",
        type=Path,
        default=DEFAULT_CONTENT_ROOT,
        help="Content directory whose first-level folders map to projects.",
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=DEFAULT_MANIFEST_PATH,
        help="Generated manifest output path.",
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    validate = subparsers.add_parser("validate", help="Validate content without writing output.")
    validate.set_defaults(handler=command_validate)

    build = subparsers.add_parser("build", help="Validate content and write the manifest.")
    build.set_defaults(handler=command_build)

    for command, handler, help_text in (
        ("plan", command_plan, "Preview remote content changes."),
        ("sync", command_sync, "Apply content changes to the remote Worker."),
        ("snapshot", command_snapshot, "Read the remote synchronization snapshot."),
    ):
        subparser = subparsers.add_parser(command, help=help_text)
        subparser.add_argument(
            "--base-url",
            default=None,
            help="Worker base URL; defaults to PROMPT_API_BASE_URL.",
        )
        subparser.add_argument(
            "--token-env",
            default="CONTENT_SYNC_TOKEN",
            help="Environment variable containing the synchronization token.",
        )
        if command in {"plan", "sync"}:
            subparser.add_argument(
                "--prune",
                action="store_true",
                help="Soft-delete missing managed nodes for projects with sync.prune enabled.",
            )
        subparser.set_defaults(handler=handler)

    collect = subparsers.add_parser("collect", help="Run a collector that writes into content/.")
    collect.add_argument("collector", help="Collector module name, for example http_markdown.")
    collect.add_argument("--config", type=Path, required=True, help="Collector YAML configuration.")
    collect.set_defaults(handler=command_collect)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    args.content_root = args.content_root.resolve()
    args.manifest = args.manifest.resolve()
    try:
        return int(args.handler(args))
    except (ContentValidationError, ContentSyncClientError, ValueError, RuntimeError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
