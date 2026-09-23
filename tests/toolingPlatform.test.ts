import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const readProjectFile = (relativePath: string) =>
  readFile(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

test('OpenNext commands clean generated output, run the platform preflight, and keep CI Linux-authoritative', async () => {
  const [packageJson, platformCheck, outputPrep, ci, cd, readme] = await Promise.all([
    readProjectFile('../package.json'),
    readProjectFile('../scripts/check-opennext-platform.mjs'),
    readProjectFile('../scripts/prepare-opennext-output.mjs'),
    readProjectFile('../.github/workflows/ci.yml'),
    readProjectFile('../.github/workflows/cd.yml'),
    readProjectFile('../README.md'),
  ]);

  assert.match(packageJson, /"cf:build": "node scripts\/check-opennext-platform\.mjs/);
  assert.match(packageJson, /"deploy": "node scripts\/check-opennext-platform\.mjs/);
  assert.match(packageJson, /scripts\/prepare-opennext-output\.mjs/);
  assert.match(outputPrep, /rm\(outputDirectory, \{ recursive: true, force: true \}\)/);
  assert.match(outputPrep, /\.open-next/);
  assert.match(platformCheck, /process\.platform === 'win32'/);
  assert.match(platformCheck, /WSL2/);
  assert.match(ci, /runs-on: ubuntu-latest/);
  assert.match(cd, /runs-on: ubuntu-latest/);
  assert.match(readme, /OpenNext.*best-effort/);
  assert.match(readme, /Ubuntu runner/);
});
