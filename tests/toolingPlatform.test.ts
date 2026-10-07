import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const readProjectFile = (relativePath: string) =>
  readFile(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

test('OpenNext commands choose one build path and keep CI Linux-authoritative', async () => {
  const [packageJson, platformCheck, builder, ci, cd, readme] = await Promise.all([
    readProjectFile('../package.json'),
    readProjectFile('../scripts/check-opennext-platform.mjs'),
    readProjectFile('../scripts/build-cloudflare.mjs'),
    readProjectFile('../.github/workflows/ci.yml'),
    readProjectFile('../.github/workflows/cd.yml'),
    readProjectFile('../README.md'),
  ]);

  assert.match(packageJson, /"cf:build": "node scripts\/build-cloudflare\.mjs/);
  assert.match(packageJson, /"deploy": "npm run cf:build/);
  assert.doesNotMatch(packageJson, /prepare-opennext-output/);
  assert.match(builder, /selectBuildBackend/);
  assert.match(builder, /relative !== '\.open-next'/);
  assert.match(platformCheck, /process\.platform === 'win32'/);
  assert.match(platformCheck, /WSL2/);
  assert.match(ci, /runs-on: ubuntu-latest/);
  assert.match(cd, /runs-on: ubuntu-latest/);
  assert.match(readme, /Docker/);
  assert.match(readme, /Ubuntu runner/);
});
