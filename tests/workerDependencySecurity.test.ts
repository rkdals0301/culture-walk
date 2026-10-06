import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';

const modulePath = new URL('../scripts/worker-dependency-security.mjs', import.meta.url).href;
const securityModule = import(modulePath).catch(() => ({}));
const fixtureBase = path.resolve('test-results/runtime-security');
const withWorker = async (callback: (root: string) => Promise<void>) => {
  await mkdir(fixtureBase, { recursive: true });
  const root = await mkdtemp(path.join(fixtureBase, 'worker-'));
  try {
    await writeFile(path.join(root, 'worker.js'), 'export default {};');
    await callback(root);
  } finally {
    const relative = path.relative(fixtureBase, root);
    assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
    await rm(root, { recursive: true, force: true });
  }
};
const scan = async (root: string) => {
  const security = await securityModule;
  assert.equal(typeof security.findReviewedRuntimeDependencies, 'function', 'runtime dependency checker must exist');
  return security.findReviewedRuntimeDependencies(root, ['braces']);
};

test('a reviewed development-only package cannot be copied into a deployed Worker', async () => {
  await withWorker(async root => {
    await mkdir(path.join(root, 'server-functions/default/node_modules/braces'), { recursive: true });
    assert.equal((await scan(root)).length, 1);
  });
});

test('inlined module references also block deployment', async () => {
  await withWorker(async root => {
    await mkdir(path.join(root, 'server-functions/default'), { recursive: true });
    await writeFile(path.join(root, 'server-functions/default/handler.mjs'), 'var bundled = {"node_modules/braces/lib/parse.js": () => {}};');
    assert.equal((await scan(root)).length, 1);
  });
});

test('a clean Worker passes and a missing Worker fails closed', async () => {
  await withWorker(async root => {
    await mkdir(path.join(root, 'assets/_next/static'), { recursive: true });
    await writeFile(path.join(root, 'assets/_next/static/app.js'), 'const label = "brace expansion";');
    assert.deepEqual(await scan(root), []);
    await rm(path.join(root, 'worker.js'));
    await assert.rejects(() => scan(root), /worker|build/i);
  });
});
