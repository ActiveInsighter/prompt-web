export type PromptVisibility = 'public' | 'private' | 'system';

export interface Env {
  DB: D1Database;
  PROMPT_KV: KVNamespace;
  ENVIRONMENT?: string;
  MCP_BEARER_TOKEN?: string;
}

export interface AccessContext {
  authenticated: boolean;
  allowedVisibilities: PromptVisibility[];
}

export interface PromptRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  category: string;
  language: string;
  visibility: PromptVisibility;
  tags: string[];
  variables: string[];
  metadata: Record<string, unknown>;
  source: 'd1' | 'kv';
  createdAt: string;
  updatedAt: string;
}

export interface PromptSearchOptions {
  query?: string;
  category?: string;
  language?: string;
  tags?: string[];
  visibility?: PromptVisibility;
  limit?: number;
}

export interface PromptSearchResult extends PromptRecord {
  score?: number;
}

export interface KvPromptIndexEntry {
  key: string;
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  language: string;
  visibility: 'public';
  tags: string[];
  updatedAt: string;
}
