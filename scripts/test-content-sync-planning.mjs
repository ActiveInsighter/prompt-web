import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const sourceUrl = new URL('../src/content-sync/service.ts', import.meta.url);
const source = await readFile(sourceUrl, 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: 'src/content-sync/service.ts',
  reportDiagnostics: true,
});
const errors = (transpiled.diagnostics ?? []).filter(
  (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
);
assert.deepEqual(errors, [], 'content sync service must transpile without diagnostics');

const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled.outputText).toString('base64')}`;
const {
  contentSyncEntryNeedsUpdate,
  hasContentSyncPlanMutations,
} = await import(moduleUrl);

const unchangedEntry = {
  source_path: 'content/project/file.md',
  content_hash: 'sha256:stable',
};

assert.equal(
  contentSyncEntryNeedsUpdate(
    unchangedEntry,
    'content/project/file.md',
    'sha256:stable',
  ),
  false,
  'unchanged entries must not generate D1 writes',
);
assert.equal(
  contentSyncEntryNeedsUpdate(
    unchangedEntry,
    'content/project/moved.md',
    'sha256:stable',
  ),
  true,
  'source moves must update only the sync ledger',
);
assert.equal(
  contentSyncEntryNeedsUpdate(
    unchangedEntry,
    'content/project/file.md',
    'sha256:changed',
  ),
  true,
  'content changes must be synchronized',
);
assert.equal(
  contentSyncEntryNeedsUpdate(undefined, 'content/project/file.md', 'sha256:new'),
  true,
  'new entities must be synchronized',
);

const emptyStats = () => ({
  created: 0,
  updated: 0,
  moved: 0,
  unchanged: 1,
  deleted: 0,
});
const unchangedPlan = {
  manifestHash: 'sha256:manifest',
  prune: true,
  projects: emptyStats(),
  folders: emptyStats(),
  files: emptyStats(),
  deletions: [],
};

assert.equal(
  hasContentSyncPlanMutations(unchangedPlan),
  false,
  'an all-unchanged manifest must short-circuit before creating a sync run',
);
assert.equal(
  hasContentSyncPlanMutations({
    ...unchangedPlan,
    files: { ...emptyStats(), updated: 1, unchanged: 0 },
  }),
  true,
  'an updated file must produce a synchronization run',
);
assert.equal(
  hasContentSyncPlanMutations({
    ...unchangedPlan,
    deletions: [
      {
        syncKey: 'file:obsolete',
        entityType: 'file',
        entityId: 'obsolete',
        projectId: 'project',
        sourcePath: 'content/project/obsolete.md',
      },
    ],
  }),
  true,
  'pruning must still produce a synchronization run',
);

console.log('content sync planning tests passed');
