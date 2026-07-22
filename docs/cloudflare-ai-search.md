# Cloudflare AI Search

Prompt Web uses Cloudflare AI Search built-in storage as a derived semantic index. D1 remains the authoritative source for projects, paths, metadata, permissions, complete content, and version history.

## Architecture

```text
content/
  -> manifest
  -> D1 content sync
  -> transactional ai_search_jobs outbox
  -> scheduled Worker processor
  -> one AI Search instance per project
  -> Items API upload of prompt_files.content
```

There is no crawler, sitemap, HTML rendering layer, or public indexing tree. Markdown, MDX-like tags, formulas, and code are uploaded from the D1 `content` field without transformation.

## Binding

`wrangler.jsonc` binds one namespace rather than one fixed instance:

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

The Worker creates deterministic instance IDs at runtime. Project slugs may change without moving the project to another instance because the stable project ID participates in the generated identifier and the final mapping is persisted in D1.

## D1 tables

- `ai_search_projects`: stable project-to-instance mapping and provisioning state.
- `ai_search_items`: active file-to-item mapping, indexed revision, item ID, and error state.
- `ai_search_jobs`: transactional outbox with leases, attempts, retry time, and terminal state.

Migration `0005_create_ai_search_storage.sql` installs triggers on `content_sync_entries`. A successful content sync therefore commits its indexing intent in the same D1 operation sequence as the source data. Migration `0006_preserve_ai_search_terminal_failures.sql` prevents scheduled reconciliation from silently reactivating the same terminally failed revision.

## Instance and item lifecycle

A project instance is created with vector and keyword indexing enabled and three custom metadata fields:

```text
file_id
content_hash
visibility
```

Each file is uploaded with a versioned key and its exact D1 content:

```ts
await instance.items.uploadAndPoll(itemKey, file.content, {
  metadata: {
    file_id: file.id,
    content_hash: file.contentHash,
    visibility: file.visibility,
  },
});
```

Updates follow this order:

1. Upload and finish indexing the new item.
2. Delete the previous item when its ID differs.
3. Commit the new active mapping to D1.

A failed upload leaves the previous searchable item and mapping intact. Jobs retry with exponential backoff. Documents larger than 4 MiB fail permanently with an explicit job error instead of repeatedly consuming retries.

## Reconciliation

The scheduled handler runs every minute. Before claiming work it reconciles D1 and the outbox:

- create jobs for projects without a ready instance;
- create jobs for missing or stale file revisions;
- create delete jobs for indexed items whose D1 document no longer exists;
- reclaim expired processing leases.

This makes the pipeline self-repairing after deployment interruption and transient Cloudflare errors. Jobs that exhaust their retry budget remain `failed` for their exact dedupe key until an administrator explicitly resets them; a new source revision naturally receives a different key and can proceed independently.

## Search isolation and permissions

Project-scoped search resolves exactly one mapped instance. All-project search batches accessible instance IDs in groups of at most ten and merges the returned chunks.

Anonymous requests apply this metadata filter before retrieval:

```ts
filters: { visibility: "public" }
```

Every returned chunk must also contain a known `file_id`. The Worker then reads `prompt_search_documents` using the caller's D1 visibility rules and discards any chunk that cannot be authorized and hydrated. AI Search metadata is never trusted as the source of project, title, path, or URL.

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
| `mode` | `auto` | `auto`, `vector`, `keyword`, or `hybrid`; `auto` resolves to vector. |
| `group` | `files` | Deduplicate by file or return chunks. |
| `threshold` | `0.4` | Retrieval threshold from 0 to 1. |
| `context` | `0` | Surrounding chunks from 0 to 3. |
| `rerank` | `false` | Enable reranking. |

## Administrative endpoints

All endpoints require the `CONTENT_SYNC_TOKEN` Bearer token.

```text
GET  /api/admin/ai-search/status
POST /api/admin/ai-search/process?limit=3
POST /api/admin/ai-search/retry-failed?limit=20
```

The status endpoint reports project mappings, item states, job states, and the latest errors. The process endpoint first reconciles and then processes a bounded batch. `retry-failed` is the only application-level path that resets terminal jobs, and moves a bounded oldest-first batch back to `retry`. Normal operation uses the scheduled handler and the post-sync `waitUntil` task.

## Deployment sequence

Production must apply D1 migrations before deploying the Worker code. The existing deployment workflow already follows that order. Migration `0005` seeds jobs for all current active projects and files, so the first scheduled executions backfill the new project instances without changing source content.

The previous fixed `ai-search-prompt` crawler instance is intentionally not deleted by application code. Remove it from the Cloudflare dashboard only after the new project mappings report ready and the expected item counts are indexed.
