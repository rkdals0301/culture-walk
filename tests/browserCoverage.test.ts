import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const readProjectFile = (relativePath: string) =>
  readFile(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

test('critical browser E2E covers Chromium, Firefox, and WebKit in CI', async () => {
  const [playwrightConfig, workflow] = await Promise.all([
    readProjectFile('../playwright.config.ts'),
    readProjectFile('../.github/workflows/ci.yml'),
  ]);

  assert.match(playwrightConfig, /browserName:\s*'chromium'/);
  assert.match(playwrightConfig, /browserName:\s*'firefox'/);
  assert.match(playwrightConfig, /browserName:\s*'webkit'/);
  assert.match(playwrightConfig, /const crossBrowserProjects = isCI/);
  assert.match(workflow, /playwright install --with-deps chromium firefox webkit/);
});
