export interface SyncEntryFingerprint {
  source_path: string;
  content_hash: string;
}

export interface SyncMutationStats {
  created: number;
  updated: number;
  moved: number;
  unchanged: number;
  deleted: number;
}

export interface SyncMutationPlan {
  projects: SyncMutationStats;
  folders: SyncMutationStats;
  files: SyncMutationStats;
  deletions: readonly unknown[];
}

export function contentSyncEntryNeedsUpdate(
  entry: SyncEntryFingerprint | undefined,
  sourcePath: string,
  contentHash: string,
): boolean {
  return !entry || entry.source_path !== sourcePath || entry.content_hash !== contentHash;
}

export function hasContentSyncPlanMutations(plan: SyncMutationPlan): boolean {
  const hasEntityMutations = [plan.projects, plan.folders, plan.files].some(
    (stats) => stats.created > 0 || stats.updated > 0 || stats.moved > 0 || stats.deleted > 0,
  );
  return hasEntityMutations || plan.deletions.length > 0;
}
