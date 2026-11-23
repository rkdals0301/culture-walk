import { spawn } from 'node:child_process';
import { copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createDependencySignature, validateBuildSourcePath } from './cloudflare-build-options.mjs';

const root = '/workspace/project';
const readJson = async file => { try { return JSON.parse(await readFile(file, 'utf8')); } catch { return null; } };
const run = args => new Promise((resolve, reject) => {
  const child = spawn('npm', args, { cwd: root, env: process.env, stdio: 'inherit' });
  child.on('error', reject);
  child.on('close', code => code === 0 ? resolve() : reject(new Error(`Linux build exited with code ${code}`)));
});

const main = async () => {
  if (process.platform !== 'linux') throw new Error('The container build entrypoint requires Linux');
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const { files: sourceFiles, args = [] } = JSON.parse(input);
  const files = sourceFiles.map(validateBuildSourcePath);
  await mkdir(root, { recursive: true });
  const copyStartedAt = performance.now();
  let previous = [];
  try { previous = JSON.parse(await readFile('/workspace/source-files.json', 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!Array.isArray(previous)) throw new Error('Invalid source synchronization manifest');
  const current = new Set(files);
  for (const value of previous) {
    const relative = validateBuildSourcePath(value);
    if (!current.has(relative)) await rm(path.join(root, relative), { force: true });
  }
  for (let index = 0; index < files.length; index += 16) {
    await Promise.all(files.slice(index, index + 16).map(async relative => {
      const target = path.join(root, relative);
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(path.join('/input', relative), target);
    }));
  }
  await writeFile('/workspace/source-files.json', JSON.stringify(files));
  const sourceCopyMs = Math.round(performance.now() - copyStartedAt);
  const signature = createDependencySignature(await readFile(path.join(root, 'package.json'), 'utf8'),
    await readFile(path.join(root, 'package-lock.json'), 'utf8'));
  const saved = await readJson('/workspace/dependencies.json');
  const complete = await Promise.all(['next/dist/bin/next', '@opennextjs/cloudflare/dist/cli/index.js']
    .map(file => stat(path.join(root, 'node_modules', file)).then(value => value.size > 0).catch(() => false)));
  const installStartedAt = performance.now();
  const dependenciesReused = saved?.signature === signature && complete.every(Boolean);
  if (!dependenciesReused) {
    await rm('/workspace/dependencies.json', { force: true });
    await run(['ci', '--no-audit', '--no-fund', '--prefer-offline', '--cache', '/workspace/npm-cache']);
    await writeFile('/workspace/dependencies.json', JSON.stringify({ signature }));
  }
  const installMs = Math.round(performance.now() - installStartedAt);
  const buildStartedAt = performance.now();
  await run(['run', 'cf:build', '--', ...args]);
  const buildMs = Math.round(performance.now() - buildStartedAt);
  const nativeReport = await readJson(path.join(root, 'test-results/build-performance/latest.json'));
  await mkdir(path.join(root, 'test-results/build-performance'), { recursive: true });
  await writeFile(path.join(root, 'test-results/build-performance/container.json'), JSON.stringify({
    nodeVersion: process.version, sourceCopyMs, installMs, buildMs, dependenciesReused, phases: nativeReport?.phases ?? [],
  }, null, 2));
};

main().catch(error => { console.error(`[build-linux] ${error.message}`); process.exitCode = 1; });
