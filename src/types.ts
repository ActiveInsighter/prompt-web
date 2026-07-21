export type PromptVisibility = 'public' | 'private';
export type PromptRole = 'system' | 'developer' | 'user' | 'template' | 'reference';
export type LibraryNodeType = 'folder' | 'file';

export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  PROMPT_KV: KVNamespace;
  PROMPT_AI_SEARCH: AiSearchInstance;
  AI_SEARCH_FOLDER_ROOT?: string;
  AI_SEARCH_PROJECT_SCOPE_MODE?: string;
  ENVIRONMENT?: string;
  MCP_BEARER_TOKEN?: string;
  CONTENT_SYNC_TOKEN?: string;
}

export interface AccessContext {
  authenticated: boolean;
  allowedVisibilities: PromptVisibility[];
}

export interface ProjectRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  visibility: PromptVisibility;
  defaultLanguage: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryNodeRecord {
  id: string;
  projectId: string;
  parentId: string | null;
  type: LibraryNodeType;
  name: string;
  path: string;
  depth: number;
  sortOrder: number;
  visibility: PromptVisibility | null;
  title?: string;
  description?: string;
  language?: string;
  promptRole?: PromptRole;
  updatedAt: string;
}

export interface PromptFileRecord {
  id: string;
  projectId: string;
  projectSlug: string;
  projectName: string;
  path: string;
  parentPath: string;
  fileName: string;
  uri: string;
  title: string;
  description: string;
  content: string;
  language: string;
  format: 'markdown' | 'text' | 'json';
  promptRole: PromptRole;
  visibility: PromptVisibility;
  tags: string[];
  variables: string[];
  metadata: Record<string, unknown>;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface PromptSearchOptions {
  query?: string;
  project?: string;
  directory?: string;
  recursive?: boolean;
  language?: string;
  tags?: string[];
  visibility?: PromptVisibility;
  promptRole?: PromptRole;
  limit?: number;
}

export interface PromptSearchResult extends Omit<PromptFileRecord, 'content'> {
  score?: number;
}

export interface DirectoryListing {
  project: ProjectRecord;
  path: string;
  entries: LibraryNodeRecord[];
}

export interface KvCommonPrompt {
  key: string;
  title: string;
  description: string;
  content: string;
  language: string;
  variables: string[];
  metadata: Record<string, unknown>;
  version: number;
  updatedAt: string;
}

export interface BootstrapManifest {
  version: number;
  bundleKey: string;
}

export interface BootstrapBundle {
  version: number;
  title: string;
  content: string;
  items: string[];
  updatedAt: string;
}

export interface BootstrapContext extends BootstrapBundle {
  client: string;
  profile: string;
  sourceKey: string;
}
