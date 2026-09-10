import {
  CULTURE_EDGE_CACHE_TAGS,
  createPublicEdgeCacheHeaders,
  NO_STORE_CACHE_HEADERS,
} from '@/server/httpCache';

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const readProjectFile = (relativePath: string) =>
  readFile(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

test('edge cache headers keep browser and Cloudflare freshness windows separate', () => {
  const headers = createPublicEdgeCacheHeaders({
    browserMaxAgeSeconds: 30,
    edgeMaxAgeSeconds: 600,
    staleWhileRevalidateSeconds: 1800,
    staleIfErrorSeconds: 86400,
    source: 'kv-read-model',
    tags: [CULTURE_EDGE_CACHE_TAGS.all, CULTURE_EDGE_CACHE_TAGS.list],
  });

  assert.equal(headers['Cache-Control'], 'public, max-age=30');
  assert.doesNotMatch(headers['Cache-Control'], /s-maxage/);
  assert.equal(
    headers['Cloudflare-CDN-Cache-Control'],
    'public, max-age=600, stale-while-revalidate=1800, stale-if-error=86400'
  );
  assert.equal(headers['X-Culture-Data-Source'], 'kv-read-model');
  assert.equal(headers['Cache-Tag'], 'culture-public-data,culture-list');
});

test('non-success responses explicitly bypass browser and Workers Cache storage', () => {
  assert.equal(NO_STORE_CACHE_HEADERS['Cache-Control'], 'no-store');
  assert.equal(NO_STORE_CACHE_HEADERS['Cloudflare-CDN-Cache-Control'], 'no-store');
});

test('Workers Cache is version isolated and culture routes opt into edge-only cache directives', async () => {
  const [wrangler, worker, feed, viewport, detail, list] = await Promise.all([
    readProjectFile('../wrangler.jsonc'),
    readProjectFile('../worker.js'),
    readProjectFile('../src/app/api/cultures/feed/route.ts'),
    readProjectFile('../src/app/api/cultures/viewport/route.ts'),
    readProjectFile('../src/app/api/cultures/[id]/route.ts'),
    readProjectFile('../src/app/api/cultures/route.ts'),
  ]);

  assert.match(wrangler, /"cache"\s*:\s*\{[\s\S]*?"enabled"\s*:\s*true/);
  assert.match(wrangler, /"cross_version_cache"\s*:\s*false/);

  for (const route of [feed, viewport, detail, list]) {
    assert.match(route, /createPublicEdgeCacheHeaders/);
    assert.match(route, /NO_STORE_CACHE_HEADERS/);
    assert.doesNotMatch(route, /s-maxage=/);
  }

  assert.match(worker, /withSitemapEdgeCache/);
  assert.match(worker, /ctx\.cache\.purge/);
  assert.match(worker, /snapshot-\$\{trigger\}/);
  assert.match(worker, /detail-refresh/);
  assert.match(worker, /manual-sync/);
});
