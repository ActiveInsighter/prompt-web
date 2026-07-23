import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const message = process.argv.slice(2).join(' ') || 'Record workflow state [skip ci]';
const stateFiles = [
  '.github/latest-run-id.txt',
  '.github/latest-run-url.txt',
  '.github/recent-run-ids.txt',
  '.github/latest-run.json',
  '.github/build-history.json',
  '.github/latest-build-log.txt',
  '.github/latest-actions-log.txt'
];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: 'inherit',
    ...options
  });
  return result.status ?? 1;
}

run('git', ['config', 'user.name', 'github-actions[bot]']);
run('git', ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com']);

const existingStateFiles = stateFiles.filter((filePath) => existsSync(filePath));
if (existingStateFiles.length === 0) {
  console.log('No workflow state files exist yet.');
  process.exit(0);
}

if (run('git', ['add', '--', ...existingStateFiles]) !== 0) {
  process.exit(1);
}

if (run('git', ['diff', '--cached', '--quiet'], { stdio: 'ignore' }) === 0) {
  console.log('No workflow state changes to commit.');
  process.exit(0);
}

if (run('git', ['commit', '-m', message]) !== 0) {
  process.exit(1);
}

for (let attempt = 1; attempt <= 3; attempt += 1) {
  if (run('git', ['push', 'origin', 'HEAD:main']) === 0) {
    process.exit(0);
  }

  console.warn(`Push attempt ${attempt} failed; rebasing onto origin/main.`);
  if (run('git', ['fetch', 'origin', 'main']) !== 0) break;
  if (run('git', ['rebase', 'origin/main']) !== 0) break;
}

process.exit(1);
