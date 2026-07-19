import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { renderPromptTemplate } from '../lib/prompt-utils';
import { PromptRepository } from '../repositories/prompt-repository';
import type { AccessContext, Env, PromptSearchOptions } from '../types';

function textResult(value: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
  };
}

function errorResult(message: string) {
  return { ...textResult({ error: message }), isError: true };
}

const searchInputSchema = {
  query: z.string().trim().max(300).optional(),
  project: z.string().trim().max(100).optional(),
  directory: z.string().trim().max(500).optional(),
  recursive: z.boolean().default(true),
  language: z.string().trim().max(50).optional(),
  tags: z.array(z.string().trim().max(50)).max(10).optional(),
  visibility: z.enum(['public', 'private']).optional(),
  promptRole: z.enum(['system', 'developer', 'user', 'template', 'reference']).optional(),
  limit: z.number().int().min(1).max(50).default(10),
};

export function createPromptMcpServer(env: Env, access: AccessContext): McpServer {
  const repository = new PromptRepository(env);
  const server = new McpServer({
    name: 'prompt-library',
    version: '0.3.0',
  });

  server.registerTool(
    'list_projects',
    {
      title: 'List prompt projects',
      description:
        'List projects visible to the caller. Use this before browsing when the target project is unknown.',
      inputSchema: {},
    },
    async () => textResult({ projects: await repository.listProjects(access) }),
  );

  server.registerTool(
    'list_directory',
    {
      title: 'List a prompt directory',
      description:
        'List the direct children of a project directory. Paths start with /. Directories can be nested to any depth.',
      inputSchema: {
        project: z.string().trim().min(1).max(100),
        path: z.string().trim().max(500).default('/'),
      },
    },
    async ({ project, path }) => {
      const listing = await repository.listDirectory(project, path, access);
      return listing ? textResult(listing) : errorResult('Project or directory not found.');
    },
  );

  server.registerTool(
    'search_files',
    {
      title: 'Search prompt files',
      description:
        'Search D1 prompt files by text, project, directory, language, tags, visibility, and prompt role. Returns metadata only; call fetch_file to read content.',
      inputSchema: searchInputSchema,
    },
    async (input) =>
      textResult({
        results: await repository.search(input, access),
        authenticated: access.authenticated,
      }),
  );

  server.registerTool(
    'fetch_file',
    {
      title: 'Fetch a prompt file',
      description:
        'Read one complete prompt file by immutable file id, prompt:// URI, project:/path identifier, or legacy path.',
      inputSchema: {
        identifier: z.string().trim().min(1).max(800),
      },
    },
    async ({ identifier }) => {
      const file = await repository.get(identifier, access);
      return file ? textResult(file) : errorResult('Prompt file not found or not accessible.');
    },
  );

  server.registerTool(
    'fetch_files',
    {
      title: 'Fetch multiple prompt files',
      description: 'Read up to 10 prompt files in one call after search_files returns related results.',
      inputSchema: {
        identifiers: z.array(z.string().trim().min(1).max(800)).min(1).max(10),
      },
    },
    async ({ identifiers }) => {
      const files = (await repository.getMany(identifiers, access)).filter(
        (file): file is NonNullable<typeof file> => file !== null,
      );
      return textResult({ files, requested: identifiers.length, found: files.length });
    },
  );

  server.registerTool(
    'render_prompt',
    {
      title: 'Render a prompt file',
      description:
        'Fetch a D1 prompt file and replace {{variable}} placeholders. Missing variables remain visible.',
      inputSchema: {
        identifier: z.string().trim().min(1).max(800),
        values: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
      },
    },
    async ({ identifier, values }) => {
      const file = await repository.get(identifier, access);
      if (!file) return errorResult('Prompt file not found or not accessible.');

      return textResult({
        id: file.id,
        uri: file.uri,
        title: file.title,
        ...renderPromptTemplate(file.content, values),
      });
    },
  );

  server.registerTool(
    'get_bootstrap_context',
    {
      title: 'Get conversation bootstrap context',
      description:
        'Read a versioned, pre-composed base prompt bundle from KV. Call once near the start of a relevant conversation; do not repeat when the version is unchanged.',
      inputSchema: {
        client: z.enum(['chatgpt', 'codex']).default('chatgpt'),
        profile: z.string().trim().min(1).max(50).default('default'),
      },
    },
    async ({ client, profile }) => {
      const context = await repository.getBootstrapContext(client, profile);
      return context ? textResult(context) : errorResult('Bootstrap context not found.');
    },
  );

  server.registerTool(
    'get_common_prompt',
    {
      title: 'Get a common public prompt',
      description:
        'Read one public, versioned common prompt directly from KV by an exact common:* key. KV is not used for fuzzy search.',
      inputSchema: {
        key: z.string().trim().min(1).max(200),
      },
    },
    async ({ key }) => {
      const prompt = await repository.getCommonPrompt(key);
      return prompt ? textResult(prompt) : errorResult('Common prompt not found.');
    },
  );

  // Backward-compatible aliases for clients configured against version 0.2.
  server.registerTool(
    'search',
    {
      title: 'Search prompts (legacy alias)',
      description: 'Compatibility alias for search_files. The old category field maps to project.',
      inputSchema: {
        query: z.string().trim().max(300).optional(),
        category: z.string().trim().max(100).optional(),
        project: z.string().trim().max(100).optional(),
        directory: z.string().trim().max(500).optional(),
        recursive: z.boolean().default(true),
        language: z.string().trim().max(50).optional(),
        tags: z.array(z.string().trim().max(50)).max(10).optional(),
        visibility: z.enum(['public', 'private']).optional(),
        promptRole: z.enum(['system', 'developer', 'user', 'template', 'reference']).optional(),
        limit: z.number().int().min(1).max(50).default(10),
      },
    },
    async ({ category, ...input }) => {
      const options: PromptSearchOptions = { ...input, project: input.project ?? category };
      return textResult({
        results: await repository.search(options, access),
        authenticated: access.authenticated,
      });
    },
  );

  server.registerTool(
    'fetch',
    {
      title: 'Fetch a prompt (legacy alias)',
      description: 'Compatibility alias for fetch_file.',
      inputSchema: {
        identifier: z.string().trim().min(1).max(800),
      },
    },
    async ({ identifier }) => {
      const file = await repository.get(identifier, access);
      return file ? textResult(file) : errorResult('Prompt file not found or not accessible.');
    },
  );

  server.registerTool(
    'list_categories',
    {
      title: 'List projects (legacy alias)',
      description: 'Compatibility alias that returns accessible projects as categories.',
      inputSchema: {},
    },
    async () => {
      const projects = await repository.listProjects(access);
      return textResult({
        categories: projects.map((project) => ({
          category: project.slug,
          name: project.name,
        })),
      });
    },
  );

  return server;
}
