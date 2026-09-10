#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const persistDirectory = path.resolve(projectRoot, '.wrangler', 'e2e');
const workerBundle = path.resolve(projectRoot, '.open-next', 'worker.js');
const seedFile = path.resolve(projectRoot, 'e2e', 'fixtures', 'seed.sql');
const wranglerPath = path.resolve(projectRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

const run = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [wranglerPath, ...args], {
      cwd: projectRoot,
      env: { ...process.env, CI: 'true' },
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(stderr.trim() || stdout.trim() || `Wrangler exited with code ${code}`));
    });
  });

const assertInsideProject = (targetPath) => {
  const relative = path.relative(projectRoot, targetPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to modify an E2E path outside the project: ${targetPath}`);
  }
};

const main = async () => {
  assertInsideProject(persistDirectory);

  try {
    await fs.access(workerBundle);
  } catch {
    throw new Error('OpenNext worker bundle is missing. Run `npm run cf:build` before the E2E runner.');
  }

  await fs.rm(persistDirectory, { recursive: true, force: true });
  await fs.mkdir(persistDirectory, { recursive: true });

  const persistenceArgs = ['--local', '--persist-to', persistDirectory];
  await run(['d1', 'migrations', 'apply', 'culture-walk-db', ...persistenceArgs]);
  await run(['d1', 'execute', 'culture-walk-db', ...persistenceArgs, '--yes', '--file', seedFile]);

  console.log(`[e2e] isolated D1 prepared at ${path.relative(projectRoot, persistDirectory)}`);
};

main().catch((error) => {
  console.error(`[e2e] prepare failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
