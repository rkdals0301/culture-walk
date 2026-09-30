import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const readProjectFile = (relativePath: string) =>
  readFile(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

test('Pretendard preloads a small self-hosted dynamic subset and keeps uncommon glyph fallback', async () => {
  const layout = await readProjectFile('../src/app/layout.tsx');
  const dynamicFontStyles = await readProjectFile('../src/styles/_pretendard-dynamic.scss');
  const preloadedFontPath = fileURLToPath(
    new URL('../public/assets/fonts/pretendard-1.3.9/woff2-dynamic-subset/PretendardVariable.subset.91.woff2', import.meta.url)
  );
  const license = await readProjectFile('../public/assets/fonts/pretendard-1.3.9/LICENSE.txt');

  assert.match(layout, /rel='preload'/);
  assert.match(
    layout,
    /href='\/assets\/fonts\/pretendard-1\.3\.9\/woff2-dynamic-subset\/PretendardVariable\.subset\.91\.woff2'/
  );
  assert.match(layout, /as='font'/);
  assert.match(layout, /type='font\/woff2'/);
  assert.match(layout, /crossOrigin='anonymous'/);
  assert.equal((dynamicFontStyles.match(/@font-face/g) ?? []).length, 92);
  assert.match(dynamicFontStyles, /unicode-range:/);
  assert.match(
    dynamicFontStyles,
    /src: url\(\/assets\/fonts\/pretendard-1\.3\.9\/woff2-dynamic-subset\/PretendardVariable\.subset\.1\.woff2\)[\s\S]*?unicode-range:[^;]*U\+d79e-d7a3/
  );
  assert.doesNotMatch(dynamicFontStyles, /src: url\(['"]?https?:\/\//);
  assert.ok((await stat(preloadedFontPath)).size < 40_000);
  assert.match(license, /SIL OPEN FONT LICENSE Version 1\.1/);
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
