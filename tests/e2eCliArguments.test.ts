import assert from 'node:assert/strict';
import test from 'node:test';

const modulePath = new URL('../scripts/e2e-run-options.mjs', import.meta.url).href;
const optionsModule = import(modulePath).catch(() => ({}));
const parse = async (args: string[]) => {
  const options = await optionsModule;
  assert.equal(typeof options.parseE2EArguments, 'function', 'E2E argument parser must exist');
  return options.parseE2EArguments(args);
};

test('Playwright project, spec and Unicode grep arguments are preserved', async () => {
  const args = ['e2e/feed.spec.ts', '--project=mobile-chromium', '--grep', '검색|필터'];
  assert.deepEqual((await parse(args)).playwrightArgs, args);
});

test('test listing and help bypass both build and fixture preparation', async () => {
  assert.equal((await parse(['--list', '--project=api-contracts'])).inspectOnly, true);
  assert.equal((await parse(['--help'])).inspectOnly, true);
  assert.equal((await parse(['--project=api-contracts'])).inspectOnly, false);
});

test('runner-only build options do not leak into Playwright arguments', async () => {
  const rebuilt = await parse(['--force-build', 'e2e/feed.spec.ts']);
  assert.equal(rebuilt.forceBuild, true);
  assert.deepEqual(rebuilt.playwrightArgs, ['e2e/feed.spec.ts']);
  const prepared = await parse(['--run-only', '--project=api-contracts']);
  assert.equal(prepared.runOnly, true);
  assert.deepEqual(prepared.playwrightArgs, ['--project=api-contracts']);
});

test('conflicting build options fail instead of silently skipping a requested rebuild', async () => {
  await assert.rejects(() => parse(['--force-build', '--run-only']), /conflict|cannot|together/i);
});
