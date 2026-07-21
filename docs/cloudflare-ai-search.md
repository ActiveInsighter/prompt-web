# Cloudflare AI Search

Prompt Web exposes a dedicated crawl-only document tree under `/ai-index`, a dynamic XML sitemap, and Worker APIs that query the bound Cloudflare AI Search instance.

## Public indexing endpoints

```text
https://prompt.2212148739lbw.workers.dev/ai-index
https://prompt.2212148739lbw.workers.dev/robots.txt
https://prompt.2212148739lbw.workers.dev/sitemap.xml
```

The `/ai-index` root is an HTML directory page that links to every public project. Project and folder pages continue the crawl with normal HTML links. Document URLs return `text/plain; charset=utf-8` and selectively escape markup tag delimiters so JSX/MDX tags remain visible to the indexer without changing mathematical comparison operators.

Example document URL:

```text
https://prompt.2212148739lbw.workers.dev/ai-index/shadcn-ui-docs/components/button.md
```

The sitemap contains every public document as `/ai-index/<project>/<path>` with D1-backed `<lastmod>` values. Private projects and private files are never listed for anonymous crawlers.

## AI Search dashboard configuration

Create or edit the Website data source with this crawl root:

```text
Website URL:
https://prompt.2212148739lbw.workers.dev/ai-index

Specific sitemap:
https://prompt.2212148739lbw.workers.dev/sitemap.xml

Include paths:
**/ai-index
**/ai-index/**

Exclude paths:
None required inside /ai-index

Rendering mode:
Static sites
```

After saving the settings, trigger a manual sync. The crawler user agent is `Cloudflare-AI-Search`; `/robots.txt` permits `/ai-index/`, blocks the raw/API routes for that crawler, and advertises the sitemap.

The Worker binds directly to the latest `ai-search-prompt` instance through `PROMPT_AI_SEARCH`. Local `wrangler dev` uses the remote instance because the binding has `remote: true`.

## Search API

Discovery and parameter documentation:

```text
GET /api/ai-search/info
```

Search all indexed public projects:

```text
GET /api/ai-search?q=button
GET /api/v1/ai-search?q=button
```

Search one public project:

```text
GET /api/ai-search/shadcn-ui-docs?q=button
GET /api/v1/projects/shadcn-ui-docs/ai-search?q=button
```

The all-project endpoint also accepts `project=<slug>`:

```text
GET /api/ai-search?q=button&project=shadcn-ui-docs
```

Supported query parameters:

| Parameter | Default | Description |
| --- | --- | --- |
| `q` | required | Search text. `query` is accepted as an alias. |
| `project` | all public projects | Project slug for all-project routes. |
| `limit` | `10` | Number of returned results, from 1 to 20. |
| `mode` | `auto` | `auto`, `hybrid`, `vector`, or `keyword`. |
| `group` | `files` | `files` deduplicates chunks by source file; `chunks` returns raw chunks. |
| `threshold` | `0.4` | Minimum match score from 0 to 1. |
| `context` | `0` | Surrounding chunks from 0 to 3. |
| `rerank` | `false` | Enable or disable reranking. |

The Worker reads the instance capabilities dynamically. The default `auto` mode selects the best retrieval mode enabled by `ai-search-prompt`; explicitly requesting an unavailable mode returns a structured `retrieval_mode_unavailable` response. Instance capabilities are cached in each Worker isolate for five minutes.

## Project scoping

Every project-scoped request first verifies in D1 that the project exists and is public. Returned chunks are then strictly validated by parsing their indexed source URL:

```text
https://prompt.2212148739lbw.workers.dev/ai-index/<project>/<path>
```

A result is returned only when the parsed project exactly matches the requested project.

The scoping strategy is controlled by `AI_SEARCH_PROJECT_SCOPE_MODE`:

| Value | Behavior |
| --- | --- |
| `source` | Production default. Retrieve a broad candidate set and strictly filter by the project segment in each source URL. |
| `metadata` | Apply a Cloudflare `folder` metadata range filter before retrieval. |
| `auto` | Try metadata filtering first and fall back to strict source URL filtering. |

For hard pre-retrieval tenant isolation, upload items with an explicit `project` metadata field through the Items API, or use a separate AI Search instance per isolated project.

## Compact response

The public response intentionally omits internal IDs, retrieval diagnostics, capabilities, metadata, duplicate counts, and detailed scoring data. It keeps only the information needed to use a result and open the complete Markdown source:

```json
{
  "query": "padding",
  "project": "tailwindcss-docs",
  "count": 1,
  "results": [
    {
      "score": 0.91,
      "text": "# padding\n\nRelevant Markdown snippet...",
      "project": "tailwindcss-docs",
      "path": "/spacing/padding.md",
      "url": "https://prompt.2212148739lbw.workers.dev/raw/tailwindcss-docs/spacing/padding.md"
    }
  ]
}
```

`text` is the matching search chunk, not necessarily the entire file. `url` points to the complete raw Markdown document. Crawl-safe `\\u003c` and `\\u003e` sequences from `/ai-index` are restored before JSON encoding, so a normal JSON parser receives the original `<` and `>` characters without an extra backslash layer.

## Configuration

```text
AI_SEARCH_FOLDER_ROOT=https://prompt.2212148739lbw.workers.dev/ai-index
AI_SEARCH_PROJECT_SCOPE_MODE=source
```

`AI_SEARCH_FOLDER_ROOT` is used by metadata mode and result validation. When omitted, the Worker derives `/ai-index` from the incoming request origin.

## Limits

The generated sitemap follows the standard maximum of 50,000 URLs. Cloudflare AI Search accepts individual files up to 4 MB; files exceeding that limit appear in indexing error logs. The HTTP API limits queries to 1,000 characters and at most 20 returned results.

## Cloudflare documentation

- https://developers.cloudflare.com/ai-search/api/search/workers-binding/
- https://developers.cloudflare.com/ai-search/configuration/retrieval/filtering/
- https://developers.cloudflare.com/ai-search/configuration/indexing/metadata/
- https://developers.cloudflare.com/ai-search/configuration/data-source/website/
