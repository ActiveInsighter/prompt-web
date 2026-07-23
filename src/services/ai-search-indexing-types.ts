export type AiSearchJobOperation = 'ensure_instance' | 'upsert_file' | 'delete_file';
export type AiSearchJobStatus = 'pending' | 'processing' | 'retry' | 'completed' | 'failed';
export type AiSearchJobResult = 'completed' | 'skipped';
export type LocalItemStatus = 'queued' | 'processing' | 'indexed' | 'error';
export type RemoteItemStatus = 'queued' | 'running' | 'completed' | 'error' | 'skipped' | 'outdated';

export interface ProjectRow {
  id: string;
  slug: string;
}

export interface ProjectMappingRow {
  project_id: string;
  instance_id: string;
  replacement_instance_id: string | null;
  status: 'pending' | 'ready' | 'error';
}

export interface IndexedItemRow {
  file_id: string;
  project_id: string;
  instance_id: string;
  item_id: string;
  item_key: string;
  index_hash: string;
  content_hash: string;
  status: LocalItemStatus;
  chunks_count: number | null;
  previous_instance_id: string | null;
  previous_item_id: string | null;
}

export interface IndexableFileRow {
  file_id: string;
  project_id: string;
  project_slug: string;
  path: string;
  file_name: string;
  content: string;
  format: 'markdown' | 'text' | 'json';
  visibility: 'public' | 'private';
  content_hash: string;
  file_sync_hash: string;
  project_config_hash: string;
}

export interface ReconcileProjectRow {
  id: string;
  slug: string;
  config_hash: string;
  mapped_instance_id: string | null;
  replacement_instance_id: string | null;
  mapping_status: ProjectMappingRow['status'] | null;
}

export interface ReconcileFileRow {
  file_id: string;
  project_id: string;
  project_slug: string;
  path: string;
  file_sync_hash: string;
  project_config_hash: string;
  item_id: string | null;
  item_instance_id: string | null;
  item_key: string | null;
  item_index_hash: string | null;
  item_status: LocalItemStatus | null;
}

export interface AiSearchJobRow {
  id: string;
  dedupe_key: string;
  operation: AiSearchJobOperation;
  project_id: string;
  file_id: string | null;
  expected_hash: string;
  status: AiSearchJobStatus;
  attempts: number;
}

export interface PendingRemoteItemRow extends IndexedItemRow {
  checked_at: string | null;
  created_at: string;
}

export interface AiSearchProcessSummary {
  requested: number;
  claimed: number;
  completed: number;
  retried: number;
  failed: number;
  skipped: number;
  checked: number;
  indexed: number;
  remoteErrors: number;
  cleanedInstances: number;
}

export interface AiSearchIndexStatus {
  projects: Record<string, number>;
  items: Record<string, number>;
  jobs: Record<string, number>;
  documents: {
    expected: number;
    indexed: number;
    waiting: number;
    error: number;
    missing: number;
  };
  migrations: {
    pendingInstanceCleanup: number;
  };
  recentErrors: Array<{
    operation: string;
    projectId: string;
    fileId: string | null;
    attempts: number;
    error: string;
    updatedAt: string;
  }>;
}
