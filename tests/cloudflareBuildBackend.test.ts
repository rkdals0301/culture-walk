import assert from 'node:assert/strict';
import test from 'node:test';
const backendModule = import(new URL('../scripts/cloudflare-build-options.mjs', import.meta.url).href).catch(() => ({}));

test('Windows uses the Linux filesystem when Docker is available; CI keeps native builds', async () => {
  const options = await backendModule;
  assert.equal(typeof options.selectBuildBackend, 'function');
  assert.equal(options.selectBuildBackend('win32', 'auto', true), 'docker');
  assert.equal(options.selectBuildBackend('linux', 'auto', true), 'native');
  assert.equal(options.selectBuildBackend('win32', 'auto', false), 'native');
  assert.equal(options.selectBuildBackend('win32', 'native', true), 'native');
  assert.throws(() => options.selectBuildBackend('win32', 'docker', false), /Docker/);
  assert.throws(() => options.selectBuildBackend('win32', 'unknown', true), /backend/i);
});

test('different checkouts have separate Linux build volumes', async () => {
  const options = await backendModule;
  assert.equal(typeof options.createBuildVolumeName, 'function');
  const first = options.createBuildVolumeName('C:/project/culture-walk');
  assert.match(first, /^culture-walk-build-[a-f0-9]{16}$/);
  assert.equal(options.createBuildVolumeName('C:/project/culture-walk'), first);
  assert.notEqual(options.createBuildVolumeName('C:/worktrees/other'), first);
});

test('source synchronization rejects escaping paths and dependency directories', async () => {
  const options = await backendModule;
  assert.equal(typeof options.validateBuildSourcePath, 'function');
  assert.equal(options.validateBuildSourcePath('src/app/page.tsx'), 'src/app/page.tsx');
  for (const name of ['../outside', '/absolute', 'C:\\secret', '.git/config', 'node_modules/pkg/file', 'src/../../private']) {
    assert.throws(() => options.validateBuildSourcePath(name), /path/i);
  }
});

test('script-only edits reuse Linux dependencies; package, lock and lifecycle edits invalidate them', async () => {
  const options = await backendModule;
  assert.equal(typeof options.createDependencySignature, 'function');
  const pkg = { dependencies: { next: '16.3.6' }, scripts: { build: 'next build' } };
  const signature = (value: unknown, lock = '{}') => options.createDependencySignature(JSON.stringify(value), lock, ['v22', 'x64']);
  const initial = signature(pkg);
  assert.equal(signature({ ...pkg, scripts: { build: 'different build command' } }), initial);
  assert.notEqual(signature({ ...pkg, dependencies: { next: 'different-version' } }), initial);
  assert.notEqual(signature(pkg, '{"changed":true}'), initial);
  assert.notEqual(signature({ ...pkg, scripts: { ...pkg.scripts, postinstall: 'setup' } }), initial);
});
