#!/usr/bin/env node

import { spawn } from 'node:child_process';
import path from 'node:path';
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import { createE2EBuildFingerprint, canReuseE2EBuild } from './e2e-build-cache.mjs';
import { parseE2EArguments } from './e2e-run-options.mjs';

const dummyKakaoMapsKey = '00000000000000000000000000000000';
const npmCliPath = process.env.npm_execpath || path.resolve(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');

const run = (args, env = process.env) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      env,
      shell: false,
      windowsHide: true,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`E2E command exited with code ${code}`));
    });
  });

const main = async () => {
  const { runOnly, forceBuild, playwrightArgs: args, inspectOnly } = parseE2EArguments(process.argv.slice(2));
  const playwrightCli = createRequire(import.meta.url).resolve('@playwright/test/cli');
  const buildEnv = {
    ...process.env,
    KAKAO_MAP_APP_KEY: process.env.KAKAO_MAP_APP_KEY || dummyKakaoMapsKey,
  };

  // Listing tests needs neither a Worker build nor a fixture database.
  if (inspectOnly) {
    await run([playwrightCli, 'test', ...args], buildEnv);
    return;
  }
  if (!runOnly) {
    const fingerprint = await createE2EBuildFingerprint(process.cwd(), buildEnv);
    if (forceBuild || !await canReuseE2EBuild(process.cwd(), fingerprint)) {
      await run([npmCliPath, 'run', 'cf:build'], buildEnv);
      // Refuse to stamp an output if its inputs changed during the build.
      if (await createE2EBuildFingerprint(process.cwd(), buildEnv) !== fingerprint) {
        throw new Error('Build inputs changed during E2E preparation. Run the test again.');
      }
      await writeFile('.open-next/e2e-build-fingerprint.json', JSON.stringify({ fingerprint }) + '\n');
    } else console.log('[e2e] unchanged build inputs; reusing the local Worker build');
  }
  await run(['scripts/prepare-e2e.mjs'], buildEnv);
  await run([playwrightCli, 'test', ...args], buildEnv);
};

main().catch((error) => {
  console.error(`[e2e] run failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
