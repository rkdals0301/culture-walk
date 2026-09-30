import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const readProjectFile = (relativePath: string) =>
  readFile(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

test('CSP restricts default resources while allowing required Kakao integrations', async () => {
  const nextConfig = await readProjectFile('../next.config.mjs');

  assert.match(nextConfig, /"default-src 'self'"/);
  assert.match(nextConfig, /"object-src 'none'"/);
  assert.match(nextConfig, /const scriptSources = \[/);
  assert.match(nextConfig, /"'unsafe-inline'"/);
  assert.match(nextConfig, /https:\/\/dapi\.kakao\.com/);
  assert.match(nextConfig, /https:\/\/\*\.daumcdn\.net/);
  assert.match(nextConfig, /"script-src-attr 'none'"/);
  assert.match(nextConfig, /"style-src 'self' 'unsafe-inline'"/);
  assert.match(nextConfig, /"font-src 'self' data:"/);
  assert.doesNotMatch(nextConfig, /cdn\.jsdelivr\.net/);
  assert.match(nextConfig, /"img-src 'self' data: blob: https:"/);
  assert.match(nextConfig, /const connectSources = \[/);
  assert.match(nextConfig, /const frameSources = \["'self'"\]/);
  assert.match(nextConfig, /"worker-src 'self' blob:"/);
  assert.match(nextConfig, /"manifest-src 'self'"/);
});

test('webpack assets use SRI without forcing nonce-based dynamic rendering', async () => {
  const nextConfig = await readProjectFile('../next.config.mjs');

  assert.match(nextConfig, /sri:\s*\{[\s\S]*?algorithm:\s*'sha384'/);
  assert.doesNotMatch(nextConfig, /crypto\.randomUUID\(\)/);
  assert.doesNotMatch(nextConfig, /x-nonce/);
});

test('optional Google integrations extend CSP only when their environment flags are configured', async () => {
  const nextConfig = await readProjectFile('../next.config.mjs');

  assert.match(nextConfig, /hasGoogleAnalytics.*NEXT_PUBLIC_GA_MEASUREMENT_ID/);
  assert.match(nextConfig, /if \(hasGoogleAnalytics\)/);
  assert.match(nextConfig, /https:\/\/www\.googletagmanager\.com/);
  assert.match(nextConfig, /https:\/\/www\.google-analytics\.com/);

  assert.match(nextConfig, /hasGoogleAdsense.*NEXT_PUBLIC_ADSENSE_CLIENT_ID/);
  assert.match(nextConfig, /if \(hasGoogleAdsense\)/);
  assert.match(nextConfig, /https:\/\/pagead2\.googlesyndication\.com/);
  assert.match(nextConfig, /https:\/\/googleads\.g\.doubleclick\.net/);
});

test('Pretendard dynamic font subsets are self-hosted without a runtime stylesheet dependency', async () => {
  const [layout, dynamicFontStyles] = await Promise.all([
    readProjectFile('../src/app/layout.tsx'),
    readProjectFile('../src/styles/_pretendard-dynamic.scss'),
  ]);

  assert.doesNotMatch(layout, /PretendardStylesheet|cdn\.jsdelivr\.net/);
  assert.match(dynamicFontStyles, /@font-face/);
  assert.match(dynamicFontStyles, /font-family: 'Pretendard Variable'/);
  assert.match(dynamicFontStyles, /url\(\/assets\/fonts\/pretendard-1\.3\.9\/woff2-dynamic-subset\/PretendardVariable\.subset\.0\.woff2\)/);
  assert.match(dynamicFontStyles, /font-display: swap/);
  assert.doesNotMatch(dynamicFontStyles, /src:\s*url\(['"]?https?:\/\//);
});
