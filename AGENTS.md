# Repository Working Agreement

## Branch and release flow

- Never push feature work directly to `main`.
- Create a purpose-named branch, open a pull request, inspect CI jobs and raw logs, then merge.
- A push to `main` applies D1 migrations, seeds remote KV, deploys the Worker, synchronizes `content/`, and runs production smoke tests.

## Content source of truth

- `content/` is the source of truth for repository-managed prompt projects.
- Each first-level directory under `content/` is one D1 project and must contain `_project.yaml`.
- Nested directories map to folder nodes. `.md`, `.txt`, and `.json` files map to prompt files.
- Prefer explicit stable `id` values in project, folder, and file metadata so moves preserve history.
- Collectors may write only into their configured project paths. They must write atomically and must not call D1 directly.

## Schema and synchronization

- Never edit an already deployed migration. Add the next numbered migration.
- Python builds a manifest; the Worker validates it and owns all D1 write, version, tag, search-index, and prune logic.
- Pruning requires both `sync.prune: true` in `_project.yaml` and the CLI `--prune` flag.
- Only records tracked in `content_sync_entries` may be pruned.

## Required validation

Run before opening a PR:

```bash
pip install -r scripts/requirements.txt
npm install
npm run project:ci
```

The checks include TypeScript, local D1 migrations, content validation, manifest generation, Python tests, existing tests, and a Wrangler dry run.
