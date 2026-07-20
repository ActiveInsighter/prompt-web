# Cloudflare AI Search indexing

Prompt Web exposes an AI-safe JSON tree under `/api/files` and a dynamic sitemap that enumerates every public file URL.

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

Cloudflare documentation:

- https://developers.cloudflare.com/ai-search/configuration/data-source/website/
- https://developers.cloudflare.com/ai-search/configuration/data-source/

## Limits

The generated sitemap follows the standard maximum of 50,000 URLs. Cloudflare AI Search currently accepts individual files up to 4 MB; files exceeding that limit will appear in the AI Search indexing error logs.
