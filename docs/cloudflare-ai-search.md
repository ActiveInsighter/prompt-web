# Cloudflare AI Search

Prompt Web exposes an AI-safe JSON tree under `/api/files`, a dynamic sitemap for indexing, and a Worker API that queries the Cloudflare AI Search instance.

## Public indexing endpoints

```text
https://prompt.2212148739lbw.workers.dev/api/files
https://prompt.2212148739lbw.workers.dev/robots.txt
https://prompt.2212148739lbw.workers.dev/sitemap.xml
```

The sitemap contains:

- the `/api/files` project root;
- each public project root;
- each public file as `/api/files/<project>/<path>`;
- `<lastmod>` values sourced from D1 so AI Search can detect changes efficiently.

Private projects and private files are never added to the sitemap.

## AI Search dashboard configuration

Create or edit a Website data source with the Worker domain, then use these parser settings:

```text
Specific sitemap:
https://prompt.2212148739lbw.workers.dev/sitemap.xml

Include paths:
**/api/files
**/api/files/**

Exclude paths:
**/api/files/search*
**/api/files/fetch*

Rendering mode:
Static sites
```

After saving the settings, trigger a manual sync. The crawler user agent is `Cloudflare-AI-Search`; `/robots.txt` explicitly permits `/api/files` and advertises the sitemap.

The Worker binds directly to the `little-hall-7cd2` instance through `PROMPT_AI_SEARCH`. Local `wrangler dev` uses the remote instance because the binding has `remote: true`.

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
| `mode` | `auto` | `auto`, `hybrid`, `vector`, or `keyword`. `auto` reads the instance capabilities and selects an available mode. |
| `group` | `files` | `files` deduplicates chunks by source file; `chunks` returns raw chunks. |
| `threshold` | `0.4` | Minimum match score from 0 to 1. |
| `context` | `0` | Surrounding chunks from 0 to 3. |
| `rerank` | `false` | Enable or disable reranking. |

The current instance has vector indexing enabled and keyword indexing disabled, so the default `auto` mode resolves to `vector`. When keyword indexing is enabled later, `auto` can select `hybrid`. Explicitly requesting a disabled mode returns a structured `retrieval_mode_unavailable` response instead of a provider error. Instance capabilities are cached in each Worker isolate for five minutes to avoid adding a configuration request to every search.

## Project scoping

Every project-scoped request first verifies in D1 that the project exists and is public. Returned chunks are then strictly validated by parsing their indexed source URL:

```text
https://prompt.2212148739lbw.workers.dev/api/files/<project>/<path>
```

A result is returned only when the parsed project exactly matches the requested project. This prevents chunks from another project from leaking into a scoped response.

The scoping strategy is controlled by `AI_SEARCH_PROJECT_SCOPE_MODE`:

| Value | Behavior |
| --- | --- |
| `source` | Current production default. Retrieve up to 50 candidates from the shared index, then strictly filter by the project segment in each source URL. When the first pass finds no project match, retry once with a project-name hint and apply the same strict filter. |
| `metadata` | Apply a Cloudflare `folder` metadata range filter before retrieval. Use only after the exact metadata value has been verified for the index. |
| `auto` | Try metadata filtering first and fall back to source URL filtering when the metadata attempt fails or returns no matching result. |

The website crawler index currently does not produce matches for the assumed `folder` prefix, although the item source keys reliably contain `/api/files/<project>/...`. Production therefore uses `source` mode. It guarantees project-correct output, but candidate retrieval still comes from the shared vector index.

For hard pre-retrieval tenant isolation, upload items with an explicit `project` metadata field through the Items API, or use a separate AI Search instance per isolated project. Once verified custom metadata is available, switch the Worker to `metadata` or adapt the filter to that field.

The default response groups chunks by file and includes:

- the best matching text chunk and score;
- the original indexed source key;
- project and file path parsed from the source URL;
- direct `/api/files`, `/p`, and `/raw` paths;
- Cloudflare scoring details and source metadata;
- the requested and effective retrieval modes;
- diagnostics for capabilities, scope mode, scope strategy, candidate attempts, excluded chunks, duplicate chunks, and automatic fallback.

## Configuration

```text
AI_SEARCH_FOLDER_ROOT=https://prompt.2212148739lbw.workers.dev/api/files
AI_SEARCH_PROJECT_SCOPE_MODE=source
```

`AI_SEARCH_FOLDER_ROOT` is used by metadata mode and by result validation. When it is omitted, the Worker derives the root from the incoming request origin. Set it explicitly when the public crawler source uses a different canonical hostname from the Worker request URL.

Unknown `AI_SEARCH_PROJECT_SCOPE_MODE` values safely fall back to `source` mode.

## Limits

The generated sitemap follows the standard maximum of 50,000 URLs. Cloudflare AI Search accepts individual files up to 4 MB; files exceeding that limit appear in the AI Search indexing error logs. The HTTP API limits queries to 1,000 characters and at most 20 returned results. Source-scoped project searches request at most 50 candidate chunks internally before strict filtering.

## Cloudflare documentation

- https://developers.cloudflare.com/ai-search/api/search/workers-binding/
- https://developers.cloudflare.com/ai-search/configuration/retrieval/filtering/
- https://developers.cloudflare.com/ai-search/configuration/indexing/metadata/
- https://developers.cloudflare.com/ai-search/configuration/data-source/website/
