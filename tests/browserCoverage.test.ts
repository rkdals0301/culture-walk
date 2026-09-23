import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const readProjectFile = (relativePath: string) =>
  readFile(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

test('critical browser E2E covers Chromium/Firefox locally and WebKit on the deployed Cloudflare runtime', async () => {
  const [playwrightConfig, workflow, compatSpec, productionConfig, productionWorkflow, productionSpec] =
    await Promise.all([
      readProjectFile('../playwright.config.ts'),
      readProjectFile('../.github/workflows/ci.yml'),
      readProjectFile('../e2e/browser-compat.spec.ts'),
      readProjectFile('../playwright.production.config.ts'),
      readProjectFile('../.github/workflows/production-browser-smoke.yml'),
      readProjectFile('../e2e/production/browser-compat.spec.ts'),
    ]);

  assert.match(playwrightConfig, /browserName:\s*'chromium'/);
  assert.match(playwrightConfig, /browserName:\s*'firefox'/);
  assert.doesNotMatch(playwrightConfig, /browserName:\s*'webkit'/);
  assert.match(playwrightConfig, /testIgnore:\s*'\*\*\/production\/\*\*'/);
  assert.match(playwrightConfig, /testMatch:\s*'\*\*\/browser-compat\.spec\.ts'/);
  assert.match(playwrightConfig, /workers:\s*isCI \? 1 : 4/);
  assert.match(playwrightConfig, /fullyParallel:\s*!isCI/);
  assert.match(compatSpec, /핵심 피드 화면/);
  assert.match(compatSpec, /핵심 지도 화면/);
  assert.match(compatSpec, /핵심 상세 화면/);
  assert.match(workflow, /playwright install --with-deps chromium firefox/);

  assert.match(productionConfig, /browserName:\s*'webkit'/);
  assert.match(productionConfig, /https:\/\/culturewalk\.gangmin\.dev/);
  assert.match(productionWorkflow, /workflows:\s*\n\s*- CD/);
  assert.match(productionWorkflow, /playwright install --with-deps webkit/);
  assert.match(productionWorkflow, /playwright\.production\.config\.ts/);
  assert.match(productionSpec, /운영 WebKit에서 피드와 상세 탐색이 동작한다/);
  assert.match(productionSpec, /운영 WebKit에서 지도 핵심 화면이 동작한다/);
});
