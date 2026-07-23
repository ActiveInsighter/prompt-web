# Cloudflare AI Search

Prompt Web uses Cloudflare AI Search built-in storage as a derived semantic index. D1 remains the authoritative source for projects, paths, metadata, permissions, complete content, and version history.

## Architecture

```text
content/
  -> manifest
  -> D1 content sync
  -> transactional ai_search_jobs outbox
  -> scheduled Worker processor
  -> one readable AI Search instance per project
  -> Items API upload of prompt_files.content
  -> remote status verification
```

There is no crawler, sitemap, HTML rendering layer, or public indexing tree. Markdown, MDX-like tags, formulas, and code are uploaded from the D1 `content` field without transformation.

## Namespace binding

`wrangler.jsonc` binds the Worker to the `prompt-projects` namespace:

```json
{
  "ai_search_namespaces": [
    {
      "binding": "PROMPT_AI_SEARCH",
      "namespace": "prompt-projects",
      "remote": true
    }
  ]
}
```

The instance name is the normalized project slug itself. No database ID or generated hash is appended:

```text
prompt-library
shadcn-ui-docs
tailwindcss-docs
zustand-docs
```

The final project-to-instance mapping is persisted in D1. A project slug change therefore creates a readable replacement instance, migrates the project documents, and removes the previous instance only after every replacement document has completed indexing.

## Readable file names

Each AI Search Item key is the source file's project-relative path. No generated file ID, content hash, or revision token appears in the Cloudflare dashboard:

```text
components/progress.md
guides/content-sync.md
learn/guides/testing.md
```

The source path is normalized to `/` separators and keeps Unicode file and folder names. D1 still stores the immutable internal file ID as metadata so search results can be authorized and hydrated safely.

## D1 tables

- `ai_search_projects`: project-to-instance mapping, migration source instance, and provisioning state.
- `ai_search_items`: active remote item, readable key, verified remote state, and the previous searchable item retained during replacement.
- `ai_search_jobs`: transactional outbox with leases, attempts, retry time, and terminal state.

Migration `0005_create_ai_search_storage.sql` installs the content-sync outbox. Migration `0006_preserve_ai_search_terminal_failures.sql` preserves terminal failures. Migration `0007_readable_ai_search_layout.sql` adds truthful queued/processing/indexed/error states and safely migrates legacy hashed instances and item keys.

## Instance and item lifecycle

A project instance is created with vector and keyword indexing enabled and three custom metadata fields:

```text
file_id
content_hash
visibility
```

A file upload uses its readable source path:

```ts
const item = await instance.items.upload(file.path, file.content, {
  metadata: {
    file_id: file.id,
    content_hash: file.contentHash,
    visibility: file.visibility,
  },
});
```

`items.upload()` only queues Cloudflare processing. Prompt Web therefore records the item as `queued`, polls `instance.items.get(item.id).info()`, and marks it `indexed` only when Cloudflare reports `completed`.

Updates and migrations follow this order:

1. Keep the currently searchable item or legacy instance intact.
2. Upload the replacement with the readable source path.
3. Poll the remote item until it is `completed`.
4. Commit the verified item mapping to D1.
5. Delete the superseded item.
6. Delete the legacy hashed instance after every project document is verified in the readable instance.

Remote `error`, `skipped`, or `outdated` states are recorded and automatically queued for a fresh upload. Documents larger than 4 MiB fail permanently with an explicit job error.

## Reconciliation

The scheduled handler runs every minute. Before claiming work it:

- creates jobs for missing or incorrectly named project instances;
- creates jobs for missing, stale, failed, or incorrectly named files;
- checks queued and processing Items against Cloudflare's real status;
- requeues remote failures;
- creates delete jobs for documents removed from D1;
- reclaims expired processing leases;
- removes a legacy instance only after its readable replacement is complete.

The administrative status endpoint reports both outbox state and document convergence:

```json
{
  "documents": {
    "expected": 348,
    "indexed": 348,
    "waiting": 0,
    "error": 0,
    "missing": 0
  },
  "migrations": {
    "pendingInstanceCleanup": 0
  }
}
```

## Search isolation and permissions

Project-scoped search resolves exactly one mapped instance. All-project search batches accessible instances and merges the returned chunks.

Anonymous requests apply this metadata filter before retrieval:

```ts
filters: { visibility: "public" }
```

Every returned chunk must contain a known `file_id`. The Worker then reads `prompt_search_documents` using the caller's D1 visibility rules and discards anything that cannot be authorized and hydrated. AI Search metadata is never trusted as the source of project, title, path, or URL.

## Public search API

```text
GET /api/ai-search?q=button
GET /api/ai-search/shadcn-ui-docs?q=button
GET /api/v1/ai-search?q=button
GET /api/v1/projects/shadcn-ui-docs/ai-search?q=button
```

Supported parameters:

| Parameter | Default | Description |
| --- | --- | --- |
| `q` | required | Search text; `query` is an alias. |
| `project` | accessible projects | Project slug or ID. |
| `limit` | `10` | Returned results, from 1 to 20. |
| `mode` | `auto` | `auto`, `vector`, `keyword`, or `hybrid`; `auto` leaves `retrieval_type` unset so the instance configuration decides. |
| `group` | `files` | Deduplicate by file or return chunks. |
| `threshold` | `0.4` | Retrieval threshold from 0 to 1. |
| `context` | `0` | Surrounding chunks from 0 to 3. |
| `rerank` | `false` | Enable reranking. |

## Administrative endpoints

All endpoints require the `CONTENT_SYNC_TOKEN` Bearer token.

```text
GET  /api/admin/ai-search/status
POST /api/admin/ai-search/process?limit=10
POST /api/admin/ai-search/retry-failed?limit=20
```

The process endpoint reconciles D1, polls remote Items, processes a bounded job batch, and cleans completed legacy migrations. Production deployment must not declare success until every expected document is verified as indexed, no document is waiting/error/missing, no active job remains, and no legacy instance is pending cleanup.
