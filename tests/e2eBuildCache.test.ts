import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';

const modulePath = new URL('../scripts/e2e-build-cache.mjs', import.meta.url).href;
const cacheModule = import(modulePath).catch(() => ({}));
const base = path.resolve('test-results/e2e-cache-fixtures');
const fixture = async (run: (root: string) => Promise<void>) => {
  await mkdir(base, { recursive: true });
  const root = await mkdtemp(path.join(base, 'project-'));
  try {
    await mkdir(path.join(root, 'src'), { recursive: true });
    await mkdir(path.join(root, 'e2e'), { recursive: true });
    await writeFile(path.join(root, 'src/page.tsx'), 'export default () => null;');
    await writeFile(path.join(root, 'package-lock.json'), '{}');
    await run(root);
  } finally {
    const relative = path.relative(base, root);
    assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
    await rm(root, { recursive: true, force: true });
  }
};
const fingerprint = async (root: string, env = {}) => {
  const cache = await cacheModule;
  assert.equal(typeof cache.createE2EBuildFingerprint, 'function', 'E2E build fingerprint must exist');
  return cache.createE2EBuildFingerprint(root, env);
};

test('test-only edits preserve the build fingerprint; runtime and lockfile edits invalidate it', async () => {
  await fixture(async root => {
    const original = await fingerprint(root);
    await writeFile(path.join(root, 'e2e/feed.spec.ts'), 'test("new case", () => {});');
    assert.equal(await fingerprint(root), original);
    await writeFile(path.join(root, 'src/page.tsx'), 'export default () => "changed";');
    assert.notEqual(await fingerprint(root), original);
    const changed = await fingerprint(root);
    await writeFile(path.join(root, 'package-lock.json'), '{"updated":true}');
    assert.notEqual(await fingerprint(root), changed);
  });
});

test('build-time environment changes invalidate reuse without recording secret values', async () => {
  await fixture(async root => {
    const first = await fingerprint(root, { NEXT_PUBLIC_SAMPLE: 'one', TOUR_API_KEY: 'private-key' });
    assert.notEqual(await fingerprint(root, { NEXT_PUBLIC_SAMPLE: 'two' }), first);
    assert.equal(first.length, 64);
    assert.ok(!first.includes('private-key'));
    assert.equal(await fingerprint(root, { NEXT_PUBLIC_SAMPLE: 'one', TOUR_API_KEY: 'private-key', TERM: 'different' }), first);
    await writeFile(path.join(root, '.env.local'), 'NEXT_PUBLIC_SAMPLE=three');
    assert.notEqual(await fingerprint(root, { NEXT_PUBLIC_SAMPLE: 'one', TOUR_API_KEY: 'private-key' }), first);
  });
});

test('reuse requires both a matching fingerprint and a complete Worker build', async () => {
  await fixture(async root => {
    const cache = await cacheModule;
    assert.equal(typeof cache.canReuseE2EBuild, 'function', 'E2E reuse check must exist');
    assert.equal(await cache.canReuseE2EBuild(root, 'hash'), false);
    await mkdir(path.join(root, '.open-next/assets'), { recursive: true });
    await mkdir(path.join(root, '.open-next/server-functions/default'), { recursive: true });
    await writeFile(path.join(root, '.open-next/worker.js'), 'export default {};');
    await writeFile(path.join(root, '.open-next/server-functions/default/handler.mjs'), 'export default {};');
    await writeFile(path.join(root, '.open-next/e2e-build-fingerprint.json'), JSON.stringify({ fingerprint: 'hash' }));
    assert.equal(await cache.canReuseE2EBuild(root, 'hash'), true);
    assert.equal(await cache.canReuseE2EBuild(root, 'different'), false);
    await rm(path.join(root, '.open-next/server-functions/default/handler.mjs'));
    assert.equal(await cache.canReuseE2EBuild(root, 'hash'), false);
    await rm(path.join(root, '.open-next/worker.js'));
    assert.equal(await cache.canReuseE2EBuild(root, 'hash'), false);
  });
});
