import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const readProjectFile = (relativePath: string) =>
  readFile(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

test('app-owned executable bootstraps avoid inline JavaScript while JSON-LD remains data-only', async () => {
  const [layout, analytics, themeInitializer, nextConfig] = await Promise.all([
    readProjectFile('../src/app/layout.tsx'),
    readProjectFile('../src/components/Analytics/GoogleAnalytics.tsx'),
    readProjectFile('../public/assets/scripts/theme-initializer.js'),
    readProjectFile('../next.config.mjs'),
  ]);

  assert.match(layout, /src='\/assets\/scripts\/theme-initializer\.js'/);
  assert.doesNotMatch(layout, /THEME_INITIALIZER_SCRIPT/);
  assert.doesNotMatch(analytics, /dangerouslySetInnerHTML/);
  assert.match(analytics, /google-analytics-loader/);
  assert.match(themeInitializer, /localStorage\.getItem\('theme'\)/);
  assert.match(nextConfig, /Next App Router still emits inline Flight\/bootstrap payloads/);
  assert.match(layout, /type='application\/ld\+json'/);
});
