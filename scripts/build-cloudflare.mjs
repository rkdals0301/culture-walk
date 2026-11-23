import { spawn, execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { BUILD_IMAGE, createBuildVolumeName, selectBuildBackend, validateBuildSourcePath } from './cloudflare-build-options.mjs';

const root = process.cwd();
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: '1' };
const requested = env.CULTURE_BUILD_BACKEND || 'auto';
const startedAt = performance.now();
const run = (command, args, { input, capturePhases = false } = {}) => new Promise((resolve, reject) => {
  const phases = [];
  let lines = '';
  const child = spawn(command, args, { cwd: root, env, windowsHide: true,
    stdio: [input === undefined ? 'inherit' : 'pipe', capturePhases ? 'pipe' : 'inherit', 'inherit'] });
  if (capturePhases) child.stdout.on('data', chunk => {
    process.stdout.write(chunk);
    lines += chunk;
    const complete = lines.split('\n');
    lines = complete.pop();
    for (const line of complete) {
      const stage = line.includes('Building Next.js app') ? 'next-build'
        : line.includes('Generating bundle') ? 'bundle'
          : line.includes('Building server function:') ? 'server-function'
            : line.includes('OpenNext build complete.') ? 'complete' : null;
      if (stage) phases.push({ stage, elapsedMs: Math.round(performance.now() - startedAt) });
    }
  });
  child.on('error', reject);
  child.on('close', code => code === 0 ? resolve(phases) : reject(new Error(`Build command exited with code ${code}`)));
  if (input !== undefined) {
    child.stdin.on('error', reject);
    child.stdin.end(input);
  }
});

const sourceFiles = async () => {
  const tracked = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    { cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024, windowsHide: true }).split('\0').filter(Boolean);
  const extras = (await readdir(root)).filter(name => /^\.env(?:\.|$)/.test(name) ||
    ['.dev.vars', '.npmrc', 'next-env.d.ts', 'worker-configuration.d.ts'].includes(name));
  const files = [];
  const candidates = [...new Set([...tracked, ...extras])].map(validateBuildSourcePath);
  for (let index = 0; index < candidates.length; index += 16) {
    const batch = await Promise.all(candidates.slice(index, index + 16).map(async relative => {
      try {
        const info = await lstat(path.join(root, relative));
        if (info.isSymbolicLink()) throw new Error(`Build source symlinks are unsupported: ${relative}`);
        return info.isFile() ? relative : null;
      } catch (error) { if (error.code !== 'ENOENT') throw error; return null; }
    }));
    files.push(...batch.filter(Boolean));
  }
  return files;
};

const main = async () => {
  let dockerAvailable = false;
  if (requested === 'docker' || (process.platform === 'win32' && requested === 'auto')) {
    try { dockerAvailable = execFileSync('docker', ['info', '--format', '{{.OSType}}'],
      { encoding: 'utf8', timeout: 5000, windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] }).trim() === 'linux'; }
    catch { /* Native remains available when Docker is not running. */ }
  }
  const backend = selectBuildBackend(process.platform, requested, dockerAvailable);
  if (backend === 'native') {
    if (process.platform === 'win32') await import('./check-opennext-platform.mjs');
    // OpenNext itself clears its generated output. A second recursive cleanup
    // before invoking the adapter repeats expensive Windows filesystem work.
    const pkg = JSON.parse(await readFile(path.join(root, 'node_modules/@opennextjs/cloudflare/package.json'), 'utf8'));
    const cli = path.join(root, 'node_modules/@opennextjs/cloudflare', pkg.bin['opennextjs-cloudflare']);
    const phases = await run(process.execPath, [cli, 'build', ...process.argv.slice(2)], { capturePhases: true });
    await mkdir('test-results/build-performance', { recursive: true });
    await writeFile('test-results/build-performance/latest.json', JSON.stringify({ backend, phases,
      totalMs: Math.round(performance.now() - startedAt) }, null, 2));
    return;
  }

  console.log('[build] using a Docker Linux volume for dependency installation and compilation');
  const name = `culture-walk-build-${randomUUID()}`;
  const volume = createBuildVolumeName(root);
  const args = ['run', '--name', name, '-i', '--mount', `type=volume,source=${volume},target=/workspace`,
    '--mount', `type=bind,source=${root},target=/input,readonly`];
  for (const key of Object.keys(env).filter(key =>
    /^(?:NEXT_|NEXT_PUBLIC_|OPEN_NEXT_|KAKAO_MAP_APP_KEY$|SITE_URL$|APP_BASE_URL$|TOUR_API_|SYNC_TOKEN$|NODE_OPTIONS$|GOOGLE_SITE_VERIFICATION$|NAVER_SITE_VERIFICATION$)/.test(key))) {
    args.push('--env', key);
  }
  args.push(env.CULTURE_BUILD_IMAGE || BUILD_IMAGE, 'node', '/input/scripts/build-cloudflare-container.mjs');
  const temporary = await mkdtemp(path.join(root, '.tmp-worker-export-'));
  try {
    await run('docker', args, { input: JSON.stringify({ files: await sourceFiles(), args: process.argv.slice(2) }) });
    const buildDoneAt = performance.now();
    await run('docker', ['cp', `${name}:/workspace/project/.open-next/.`, temporary]);
    for (const file of ['worker.js', 'server-functions/default/handler.mjs']) {
      const info = await stat(path.join(temporary, file));
      if (!info.isFile() || info.size === 0) throw new Error('Incomplete Linux Worker output');
    }
    const destination = path.resolve(root, '.open-next');
    const relative = path.relative(root, destination);
    if (relative !== '.open-next') throw new Error('Refusing to replace an output outside the project');
    await rm(destination, { recursive: true, force: true });
    await rename(temporary, destination);
    await mkdir('test-results/build-performance', { recursive: true });
    await run('docker', ['cp', `${name}:/workspace/project/test-results/build-performance/container.json`,
      path.join(root, 'test-results/build-performance/container.json')]);
    const container = JSON.parse(await readFile('test-results/build-performance/container.json', 'utf8'));
    const report = { backend, ...container, buildAndPreparationMs: Math.round(buildDoneAt - startedAt),
      exportMs: Math.round(performance.now() - buildDoneAt), totalMs: Math.round(performance.now() - startedAt) };
    await writeFile('test-results/build-performance/latest.json', JSON.stringify(report, null, 2));
    console.log(`[build] complete in ${(report.totalMs / 1000).toFixed(1)}s`);
  } finally {
    try { await run('docker', ['rm', '-f', name]); } catch { /* Build failures retain their original error. */ }
    const relative = path.relative(root, temporary);
    if (!relative.startsWith('.tmp-worker-export-') || relative.includes(path.sep)) throw new Error('Invalid temporary output path');
    await rm(temporary, { recursive: true, force: true });
  }
};

main().catch(error => { console.error(`[build] ${error.message}`); process.exitCode = 1; });
