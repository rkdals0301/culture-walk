#!/usr/bin/env node

import { spawn } from 'node:child_process';
import path from 'node:path';

const dummyKakaoMapsKey = '00000000000000000000000000000000';
const npmCliPath = process.env.npm_execpath || path.resolve(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');

const runNpmScript = (script, env = process.env) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [npmCliPath, 'run', script], {
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
      reject(new Error(`npm run ${script} exited with code ${code}`));
    });
  });

const main = async () => {
  const buildEnv = {
    ...process.env,
    NEXT_PUBLIC_KAKAO_MAPS_APP_KEY: process.env.NEXT_PUBLIC_KAKAO_MAPS_APP_KEY || dummyKakaoMapsKey,
  };

  await runNpmScript('cf:build', buildEnv);
  await runNpmScript('test:e2e:run', buildEnv);
};

main().catch((error) => {
  console.error(`[e2e] run failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
