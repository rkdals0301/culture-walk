import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const readProjectFile = (relativePath: string) =>
  readFile(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

test('Pretendard is preloaded from the self-hosted font asset', async () => {
  const layout = await readProjectFile('../src/app/layout.tsx');

  assert.match(layout, /rel='preload'/);
  assert.match(layout, /href='\/assets\/fonts\/PretendardVariable\.woff2'/);
  assert.match(layout, /as='font'/);
  assert.match(layout, /type='font\/woff2'/);
  assert.match(layout, /crossOrigin='anonymous'/);
});

test('self-hosted font uses a bounded reusable cache policy', async () => {
  const nextConfig = await readProjectFile('../next.config.mjs');

  assert.match(nextConfig, /source: '\/assets\/fonts\/:path\*'/);
  assert.match(
    nextConfig,
    /public, max-age=604800, stale-while-revalidate=2592000/
  );
  assert.match(nextConfig, /Cross-Origin-Resource-Policy/);
  assert.doesNotMatch(nextConfig, /assets\/fonts[\s\S]{0,400}immutable/);
});
