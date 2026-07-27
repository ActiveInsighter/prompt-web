import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AiSearchRequestError } from '../http/cloudflare-ai-search-utils';
import { createPromptUri, renderPromptTemplate } from '../lib/prompt-utils';
import { PromptRepository } from '../repositories/prompt-repository';
import {
  AiSearchServiceError,
  searchAiDocumentsFromInput,
} from '../services/ai-search-service';
import type {
  AccessContext,
  DirectoryListing,
  Env,
  ProjectRecord,
  PromptFileRecord,
  PromptSearchOptions,
  PromptSearchResult,
} from '../types';

const projectSummarySchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
});

const directoryEntrySchema = z.object({
  type: z.enum(['folder', 'file']),
  name: z.string(),
  path: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  uri: z.string().optional(),
});

const fileSummarySchema = z.object({
  title: z.string(),
  project: z.string(),
  path: z.string(),
  uri: z.string(),
  description: z.string().optional(),
  language: z.string(),
  tags: z.array(z.string()),
  bm25Rank: z.number().optional(),
});

const fileContentSchema = z.object({
  uri: z.string(),
  title: z.string(),
  project: z.string(),
  path: z.string(),
  content: z.string(),
  language: z.string(),
  format: z.enum(['markdown', 'text', 'json']),
  role: z.enum(['system', 'developer', 'user', 'template', 'reference']),
  variables: z.array(z.string()),
});

const aiSearchResultSchema = z.object({
  score: z.number(),
  title: z.string(),
  text: z.string(),
  project: z.string().nullable(),
  path: z.string().nullable(),
  uri: z.string().nullable(),
  url: z.string().nullable(),
});

const commonPromptSummarySchema = z.object({
  key: z.string(),
  title: z.string(),
  description: z.string(),
  version: z.number().int(),
  updatedAt: z.string().optional(),
});

const searchInputSchema = {
  query: z.string().trim().max(300).optional(),
  project: z.string().trim().max(100).optional(),
  directory: z.string().trim().max(500).optional(),
  recursive: z.boolean().default(true),
  language: z.string().trim().max(50).optional(),
  tags: z.array(z.string().trim().max(50)).max(10).optional(),
  visibility: z.enum(['public', 'private']).optional(),
  promptRole: z.enum(['system', 'developer', 'user', 'template', 'reference']).optional(),
  limit: z.number().int().min(1).max(20).default(10),
};

const aiSearchInputSchema = {
  query: z.string().trim().min(1).max(1_000),
  project: z.string().trim().max(128).optional(),
  limit: z.number().int().min(1).max(20).default(10),
  mode: z.enum(['hybrid', 'vector', 'keyword']).default('vector'),
  group: z.enum(['files', 'chunks']).default('files'),
  rerank: z.boolean().default(false),
};

function structuredResult(value: Record<string, unknown>) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(value) }],
    structuredContent: value,
  };
}

function errorResult(
  code: string,
  message: string,
  options: {
    retryable?: boolean;
    upstreamStatus?: number;
    details?: Record<string, unknown>;
  } = {},
) {
  const value = {
    ok: false,
    error: {
      code,
      message,
      retryable: options.retryable ?? false,
      ...(options.upstreamStatus !== undefined
        ? { upstream_status: options.upstreamStatus }
        : {}),
      ...(options.details ? { details: options.details } : {}),
    },
  };
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(value) }],
    structuredContent: value,
    isError: true,
  };
}

function compactProject(project: ProjectRecord) {
  return {
    slug: project.slug,
    name: project.name,
    description: project.description,
  };
}

function compactDirectory(listing: DirectoryListing) {
  return {
    project: listing.project.slug,
    path: listing.path,
    entries: listing.entries.map((entry) => ({
      type: entry.type,
      name: entry.name,
      path: entry.path,
      ...(entry.title ? { title: entry.title } : {}),
      ...(entry.description ? { description: entry.description } : {}),
      ...(entry.type === 'file'
        ? { uri: createPromptUri(listing.project.slug, entry.path) }
        : {}),
    })),
  };
}

function compactSearchResult(file: PromptSearchResult) {
  return {
    title: file.title,
    project: file.projectSlug,
    path: file.path,
    uri: file.uri,
    ...(file.description ? { description: file.description } : {}),
    language: file.language,
    tags: file.tags,
    ...(typeof file.score === 'number' ? { bm25Rank: file.score } : {}),
  };
}

function compactFile(file: PromptFileRecord) {
  return {
    uri: file.uri,
    title: file.title,
    project: file.projectSlug,
    path: file.path,
    content: file.content,
    language: file.language,
    format: file.format,
    role: file.promptRole,
    variables: file.variables,
  };
}

function isCommonPromptSummary(value: unknown): value is z.infer<typeof commonPromptSummarySchema> {
  return commonPromptSummarySchema.safeParse(value).success;
}

export function createPromptMcpServer(env: Env, access: AccessContext): McpServer {
  const repository = new PromptRepository(env);
  const server = new McpServer({
    name: 'prompt-library',
    version: '0.9.0',
  });

  server.registerTool(
    'list_projects',
    {
      title: 'List prompt projects',
      description: 'List projects visible to the caller. Use when the project is unknown.',
      inputSchema: {},
      outputSchema: { projects: z.array(projectSummarySchema) },
    },
    async () =>
      structuredResult({
        projects: (await repository.listProjects(access)).map(compactProject),
      }),
  );

  server.registerTool(
    'list_directory',
    {
      title: 'Browse a project directory',
      description: 'List direct children of one project directory. Paths start with /.',
      inputSchema: {
        project: z.string().trim().min(1).max(100),
        path: z.string().trim().max(500).default('/'),
      },
      outputSchema: {
        project: z.string(),
        path: z.string(),
        entries: z.array(directoryEntrySchema),
      },
    },
    async ({ project, path }) => {
      const listing = await repository.listDirectory(project, path, access);
      return listing
        ? structuredResult(compactDirectory(listing))
        : errorResult('directory_not_found', 'Project or directory not found.');
    },
  );

  server.registerTool(
    'search_files',
    {
      title: 'Search files precisely',
      description:
        'Search D1 by exact text and structured filters such as project, directory, tags, language, visibility, and role. Returns file metadata only; use fetch_file for content. bm25Rank is the raw SQLite FTS5 BM25 rank, where smaller values rank earlier. Prefer ai_search for natural-language semantic questions.',
      inputSchema: searchInputSchema,
      outputSchema: {
        query: z.string(),
        project: z.string().nullable(),
        count: z.number().int(),
        results: z.array(fileSummarySchema),
      },
    },
    async (input) => {
      const options: PromptSearchOptions = input;
      const results = (await repository.search(options, access)).map(compactSearchResult);
      return structuredResult({
        query: input.query ?? '',
        project: input.project ?? null,
        count: results.length,
        results,
      });
    },
  );

  server.registerTool(
    'ai_search',
    {
      title: 'Semantic AI search',
      description:
        'Search project-isolated Cloudflare AI Search indexes visible to the caller. Vector retrieval is used by default; hybrid and keyword modes can be selected explicitly. Each project has its own instance and documents are uploaded directly from D1 content. Returns ranked snippets plus titles, prompt:// identifiers, raw URLs, and measured duration. Use fetch_file to read a complete result.',
      inputSchema: aiSearchInputSchema,
      outputSchema: {
        query: z.string(),
        project: z.string().nullable(),
        count: z.number().int(),
        results: z.array(aiSearchResultSchema),
        meta: z.object({
          mode: z.enum(['hybrid', 'keyword', 'vector']),
          group: z.enum(['files', 'chunks']),
          duration_ms: z.number().int().nonnegative(),
        }),
      },
    },
    async (input) => {
      try {
        return structuredResult(await searchAiDocumentsFromInput(env, access, input));
      } catch (error) {
        if (error instanceof AiSearchServiceError) {
          return errorResult(error.code, error.message, {
            retryable: error.status >= 500,
            upstreamStatus:
              typeof error.details?.upstreamStatus === 'number'
                ? error.details.upstreamStatus
                : undefined,
            details: error.details,
          });
        }
        if (error instanceof AiSearchRequestError) {
          return errorResult(error.code, error.message);
        }
        throw error;
      }
    },
  );

  server.registerTool(
    'fetch_file',
    {
      title: 'Read a complete file',
      description:
        'Read one complete file by file id, prompt:// URI, project:/path identifier, or legacy path.',
      inputSchema: { identifier: z.string().trim().min(1).max(800) },
      outputSchema: fileContentSchema.shape,
    },
    async ({ identifier }) => {
      const file = await repository.get(identifier, access);
      return file
        ? structuredResult(compactFile(file))
        : errorResult('file_not_found', 'File not found or not accessible.');
    },
  );

  server.registerTool(
    'fetch_files',
    {
      title: 'Read multiple complete files',
      description: 'Read up to 10 complete files returned by search or directory browsing.',
      inputSchema: {
        identifiers: z.array(z.string().trim().min(1).max(800)).min(1).max(10),
      },
      outputSchema: {
        count: z.number().int(),
        files: z.array(fileContentSchema),
      },
    },
    async ({ identifiers }) => {
      const files = (await repository.getMany(identifiers, access))
        .filter((file): file is PromptFileRecord => file !== null)
        .map(compactFile);
      return structuredResult({ count: files.length, files });
    },
  );

  server.registerTool(
    'render_prompt',
    {
      title: 'Render a prompt template',
      description: 'Read a file and replace {{variable}} placeholders. Missing variables stay visible.',
      inputSchema: {
        identifier: z.string().trim().min(1).max(800),
        values: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
      },
      outputSchema: {
        uri: z.string(),
        title: z.string(),
        content: z.string(),
        usedVariables: z.array(z.string()),
        missingVariables: z.array(z.string()),
      },
    },
    async ({ identifier, values }) => {
      const file = await repository.get(identifier, access);
      if (!file) return errorResult('file_not_found', 'File not found or not accessible.');
      const rendered = renderPromptTemplate(file.content, values);
      return structuredResult({
        uri: file.uri,
        title: file.title,
        content: rendered.rendered,
        usedVariables: file.variables.filter((variable) => Object.hasOwn(values, variable)),
        missingVariables: rendered.missingVariables,
      });
    },
  );

  server.registerTool(
    'get_bootstrap_context',
    {
      title: 'Get conversation bootstrap context',
      description:
        'Read a versioned base prompt bundle from KV. Call once near the start of a relevant conversation.',
      inputSchema: {
        client: z.enum(['chatgpt', 'codex']).default('chatgpt'),
        profile: z.string().trim().min(1).max(50).default('default'),
      },
      outputSchema: {
        version: z.number().int(),
        title: z.string(),
        content: z.string(),
      },
    },
    async ({ client, profile }) => {
      const context = await repository.getBootstrapContext(client, profile);
      return context
        ? structuredResult({
            version: context.version,
            title: context.title,
            content: context.content,
          })
        : errorResult('bootstrap_not_found', 'Bootstrap context not found.');
    },
  );

  server.registerTool(
    'list_common_prompts',
    {
      title: 'List common public prompts',
      description: 'List discoverable public common:* prompt keys stored in KV.',
      inputSchema: {},
      outputSchema: {
        count: z.number().int(),
        prompts: z.array(commonPromptSummarySchema),
      },
    },
    async () => {
      const index = await env.PROMPT_KV.get<unknown>('index:common', 'json');
      const prompts = Array.isArray(index) ? index.filter(isCommonPromptSummary) : [];
      return structuredResult({ count: prompts.length, prompts });
    },
  );

  server.registerTool(
    'get_common_prompt',
    {
      title: 'Get a common public prompt',
      description:
        'Read one public versioned prompt from KV by an exact common:* key. Use list_common_prompts first when the key is unknown.',
      inputSchema: { key: z.string().trim().min(1).max(200) },
      outputSchema: {
        key: z.string(),
        title: z.string(),
        content: z.string(),
        variables: z.array(z.string()),
        version: z.number().int(),
      },
    },
    async ({ key }) => {
      const prompt = await repository.getCommonPrompt(key);
      return prompt
        ? structuredResult({
            key: prompt.key,
            title: prompt.title,
            content: prompt.content,
            variables: prompt.variables,
            version: prompt.version,
          })
        : errorResult('common_prompt_not_found', 'Common prompt not found.');
    },
  );

  return server;
}
