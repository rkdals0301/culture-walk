import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const readProjectFile = (relativePath: string) =>
  readFile(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

test('critical browser E2E covers Chromium broadly and Firefox/WebKit with focused CI smoke', async () => {
  const [playwrightConfig, workflow, compatSpec] = await Promise.all([
    readProjectFile('../playwright.config.ts'),
    readProjectFile('../.github/workflows/ci.yml'),
    readProjectFile('../e2e/browser-compat.spec.ts'),
  ]);

  assert.match(playwrightConfig, /browserName:\s*'chromium'/);
  assert.match(playwrightConfig, /browserName:\s*'firefox'/);
  assert.match(playwrightConfig, /browserName:\s*'webkit'/);
  assert.match(playwrightConfig, /testMatch:\s*'\*\*\/browser-compat\.spec\.ts'/);
  assert.match(playwrightConfig, /workers:\s*isCI \? 1 : 4/);
  assert.match(playwrightConfig, /fullyParallel:\s*!isCI/);
  assert.match(compatSpec, /핵심 피드 화면/);
  assert.match(compatSpec, /핵심 지도 화면/);
  assert.match(compatSpec, /핵심 상세 화면/);
  assert.match(workflow, /playwright install --with-deps chromium firefox webkit/);
});
