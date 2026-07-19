import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { renderPromptTemplate } from '../lib/prompt-utils';
import { PromptRepository } from '../repositories/prompt-repository';
import type { AccessContext, Env, PromptRecord } from '../types';

function textResult(value: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
  };
}

function toSearchResult(prompt: PromptRecord & { score?: number }) {
  return {
    id: prompt.id,
    slug: prompt.slug,
    title: prompt.title,
    description: prompt.description,
    category: prompt.category,
    language: prompt.language,
    visibility: prompt.visibility,
    tags: prompt.tags,
    variables: prompt.variables,
    source: prompt.source,
    updatedAt: prompt.updatedAt,
    score: prompt.score,
  };
}

export function createPromptMcpServer(env: Env, access: AccessContext): McpServer {
  const repository = new PromptRepository(env);
  const server = new McpServer({
    name: 'prompt-library',
    version: '0.2.0',
  });

  server.registerTool(
    'search',
    {
      title: 'Search prompts',
      description:
        'Search the prompt library by keywords, category, language, tags, and visibility. Returns metadata only; use fetch to read the full prompt.',
      inputSchema: {
        query: z.string().trim().max(300).optional(),
        category: z.string().trim().max(100).optional(),
        language: z.string().trim().max(50).optional(),
        tags: z.array(z.string().trim().max(50)).max(10).optional(),
        visibility: z.enum(['public', 'private', 'system']).optional(),
        limit: z.number().int().min(1).max(50).default(10),
      },
    },
    async (input) => {
      const results = await repository.search(input, access);
      return textResult({
        results: results.map(toSearchResult),
        authenticated: access.authenticated,
      });
    },
  );

  server.registerTool(
    'fetch',
    {
      title: 'Fetch a prompt',
      description: 'Fetch one complete prompt by its id, slug, or KV key.',
      inputSchema: {
        identifier: z.string().trim().min(1).max(200),
      },
    },
    async ({ identifier }) => {
      const prompt = await repository.get(identifier, access);
      return prompt
        ? textResult(prompt)
        : { ...textResult({ error: 'Prompt not found or not accessible.' }), isError: true };
    },
  );

  server.registerTool(
    'render_prompt',
    {
      title: 'Render a prompt',
      description:
        'Fetch a prompt and replace {{variable}} placeholders with supplied values. Missing variables remain visible in the output.',
      inputSchema: {
        identifier: z.string().trim().min(1).max(200),
        values: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
      },
    },
    async ({ identifier, values }) => {
      const prompt = await repository.get(identifier, access);
      if (!prompt) {
        return { ...textResult({ error: 'Prompt not found or not accessible.' }), isError: true };
      }

      const rendered = renderPromptTemplate(prompt.content, values);
      return textResult({
        id: prompt.id,
        slug: prompt.slug,
        title: prompt.title,
        ...rendered,
      });
    },
  );

  server.registerTool(
    'list_categories',
    {
      title: 'List prompt categories',
      description: 'List prompt categories that are accessible to the current caller.',
      inputSchema: {},
    },
    async () => textResult({ categories: await repository.listCategories(access) }),
  );

  return server;
}
