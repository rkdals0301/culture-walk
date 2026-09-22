import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const readProjectFile = (relativePath: string) =>
  readFile(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

test('CSP restricts default resources while allowing required Kakao and Google integrations', async () => {
  const nextConfig = await readProjectFile('../next.config.mjs');

  assert.match(nextConfig, /"default-src 'self'"/);
  assert.match(nextConfig, /"object-src 'none'"/);
  assert.match(nextConfig, /"script-src 'self' 'unsafe-inline'/);
  assert.match(nextConfig, /https:\/\/dapi\.kakao\.com/);
  assert.match(nextConfig, /https:\/\/\*\.daumcdn\.net/);
  assert.match(nextConfig, /https:\/\/www\.googletagmanager\.com/);
  assert.match(nextConfig, /https:\/\/pagead2\.googlesyndication\.com/);
  assert.match(nextConfig, /"script-src-attr 'none'"/);
  assert.match(nextConfig, /"style-src 'self' 'unsafe-inline' https:\/\/cdn\.jsdelivr\.net"/);
  assert.match(nextConfig, /"font-src 'self' data: https:\/\/cdn\.jsdelivr\.net"/);
  assert.match(nextConfig, /"img-src 'self' data: blob: https:"/);
  assert.match(nextConfig, /"connect-src 'self'/);
  assert.match(nextConfig, /"frame-src 'self'/);
  assert.match(nextConfig, /"worker-src 'self' blob:"/);
  assert.match(nextConfig, /"manifest-src 'self'"/);
});
