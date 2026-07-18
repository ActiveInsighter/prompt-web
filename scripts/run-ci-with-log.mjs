import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const projectRoot = process.cwd();
const logPath = path.resolve(projectRoot, '.github/latest-build-log.txt');

await fsp.mkdir(path.dirname(logPath), { recursive: true });
const logStream = fs.createWriteStream(logPath, { flags: 'a' });

function write(stream, chunk) {
  stream.write(chunk);
  logStream.write(chunk);
}

async function run(command, args, label) {
  write(process.stdout, `\n## ${label}\n`);
  write(process.stdout, `command=${[command, ...args].join(' ')}\n`);
  write(process.stdout, `started_at=${new Date().toISOString()}\n\n`);

  const child = spawn(command, args, {
    cwd: projectRoot,
    env: process.env,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stdout.on('data', (chunk) => write(process.stdout, chunk));
  child.stderr.on('data', (chunk) => write(process.stderr, chunk));

  const exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code) => resolve(code ?? 1));
  });

  write(process.stdout, `\nfinished_at=${new Date().toISOString()}\n`);
  write(process.stdout, `exit_code=${exitCode}\n`);
  return exitCode;
}

function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

async function readPackageJson() {
  try {
    return JSON.parse(await fsp.readFile(path.join(projectRoot, 'package.json'), 'utf8'));
  } catch {
    return {};
  }
}

const packageJson = await readPackageJson();
const scripts = packageJson.scripts || {};
const customCommand = process.env.CI_COMMAND?.trim();
const commands = [];

if (customCommand) {
  const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';
  const shellArgs = process.platform === 'win32'
    ? ['/d', '/s', '/c', customCommand]
    : ['-lc', customCommand];
  commands.push([shell, shellArgs, 'Custom project CI']);
} else if (scripts['project:ci']) {
  commands.push([npmCommand(), ['run', 'project:ci'], 'Project CI']);
} else {
  for (const scriptName of ['typecheck', 'lint', 'test', 'build']) {
    if (scripts[scriptName]) {
      commands.push([npmCommand(), ['run', scriptName], `npm run ${scriptName}`]);
    }
  }
}

if (commands.length === 0) {
  commands.push([process.execPath, ['--check', 'scripts/record-run-state.mjs'], 'Syntax check: run state']);
  commands.push([process.execPath, ['--check', 'scripts/git-commit-state.mjs'], 'Syntax check: state commit']);
  commands.push([process.execPath, ['--check', 'scripts/get-latest-run.mjs'], 'Syntax check: latest run helper']);
  commands.push([process.execPath, ['scripts/test-run-state.mjs'], 'Run-state self test']);
}

let finalExitCode = 0;
for (const [command, args, label] of commands) {
  const exitCode = await run(command, args, label);
  if (exitCode !== 0) {
    finalExitCode = exitCode;
    break;
  }
}

await new Promise((resolve) => logStream.end(resolve));
process.exit(finalExitCode);
