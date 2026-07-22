# AI Search storage invariants

This implementation treats D1 as the source of truth and Cloudflare AI Search as a derived index.

- Each D1 project owns one deterministic AI Search instance.
- Documents are uploaded from `prompt_files.content` directly to built-in storage.
- `content_sync_entries` triggers write indexing work to `ai_search_jobs` transactionally.
- A file revision is indexed only when both its file sync hash and project config hash match.
- Item metadata contains only `file_id`, `content_hash`, and effective `visibility`.
- Anonymous retrieval filters `visibility=public` before retrieval; D1 hydration applies the same access rules again.
- Updates upload the new version before removing the old item.
- Jobs use leases, bounded exponential backoff, and deterministic dedupe keys.
- Scheduled reconciliation repairs missing mappings, missing jobs, stale revisions, and orphaned items.
- AI Search failures never roll back a successful content synchronization.
