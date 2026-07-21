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
| `mode` | `hybrid` | `hybrid`, `vector`, or `keyword`. |
| `group` | `files` | `files` deduplicates chunks by source file; `chunks` returns raw chunks. |
| `threshold` | `0.4` | Minimum match score from 0 to 1. |
| `context` | `1` | Surrounding chunks from 0 to 3. |
| `rerank` | `true` | Enable or disable reranking. |

Project-scoped search first verifies that the project exists and is public in D1. It then applies a Cloudflare metadata range filter to the built-in `folder` field before retrieval:

```json
{
  "folder": {
    "$gte": "api/files/shadcn-ui-docs/",
    "$lt": "api/files/shadcn-ui-docs0"
  }
}
```

This includes root-level files and all nested folders in the project. Results are checked against the requested project again before they are returned.

The default response groups chunks by file and includes:

- the best matching text chunk and score;
- the original indexed source key;
- project and file path parsed from the source URL;
- direct `/api/files`, `/p`, and `/raw` paths;
- Cloudflare scoring details and source metadata;
- diagnostics for excluded and duplicate chunks.

## Configuration

The default crawler folder root is:

```text
AI_SEARCH_FOLDER_ROOT=api/files
```

If the AI Search metadata shown in Playground contains a leading slash, change it to:

```text
AI_SEARCH_FOLDER_ROOT=/api/files
```

The project parser also validates the source URL, so normal website-crawler keys under `/api/files/<project>/<path>` work with either absolute or relative item keys.

## Limits

The generated sitemap follows the standard maximum of 50,000 URLs. Cloudflare AI Search accepts individual files up to 4 MB; files exceeding that limit appear in the AI Search indexing error logs. The HTTP API limits queries to 1,000 characters and at most 20 returned results.

## Cloudflare documentation

- https://developers.cloudflare.com/ai-search/api/search/workers-binding/
- https://developers.cloudflare.com/ai-search/configuration/retrieval/filtering/
- https://developers.cloudflare.com/ai-search/configuration/data-source/website/
