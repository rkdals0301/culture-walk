import {
  CULTURE_EDGE_CACHE_TAGS,
  createPublicEdgeCacheHeaders,
  NO_STORE_CACHE_HEADERS,
} from '@/server/httpCache';
import { withCulturePageEdgeCache } from '@/server/cultureEdgeCache';

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

test('home and map document responses use a short browser and longer edge policy', async () => {
  for (const path of ['/', '/map']) {
    const response = new Response('<html><body>culture walk</body></html>', {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });

    const cached = withCulturePageEdgeCache(new Request(`https://culturewalk.gangmin.dev${path}`), response);

    assert.notStrictEqual(cached, response);
    assert.equal(cached.headers.get('Cache-Control'), 'public, max-age=60');
    assert.equal(
      cached.headers.get('Cloudflare-CDN-Cache-Control'),
      'public, max-age=600, stale-while-revalidate=1800, stale-if-error=86400'
    );
    assert.equal(cached.headers.get('Cache-Tag'), 'culture-public-data,culture-list');
    assert.equal(await cached.text(), '<html><body>culture walk</body></html>');
  }
});

test('HTML cache wrapper leaves RSC, prefetch, API, error, and personalized responses untouched', () => {
  const cases = [
    { url: 'https://culturewalk.gangmin.dev/', request: { headers: { rsc: '1' } } },
    { url: 'https://culturewalk.gangmin.dev/map?_rsc=abc', request: {} },
    {
      url: 'https://culturewalk.gangmin.dev/map',
      request: { headers: { 'next-router-prefetch': '1' } },
    },
    { url: 'https://culturewalk.gangmin.dev/api/cultures', request: {} },
    { url: 'https://culturewalk.gangmin.dev/', request: { method: 'POST' } },
    { url: 'https://culturewalk.gangmin.dev/map', request: { headers: { authorization: 'Bearer token' } } },
  ] as const;

  for (const { url, request } of cases) {
    const response = new Response('<html>not cacheable</html>', {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });

    assert.strictEqual(withCulturePageEdgeCache(new Request(url, request), response), response);
  }

  const nonHtmlResponse = new Response('{"ok":true}', {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
  assert.strictEqual(
    withCulturePageEdgeCache(new Request('https://culturewalk.gangmin.dev/'), nonHtmlResponse),
    nonHtmlResponse
  );

  const errorResponse = new Response('<html>error</html>', {
    status: 500,
    headers: { 'Content-Type': 'text/html' },
  });
  assert.strictEqual(
    withCulturePageEdgeCache(new Request('https://culturewalk.gangmin.dev/map'), errorResponse),
    errorResponse
  );

  const personalizedResponse = new Response('<html>private</html>', {
    status: 200,
    headers: { 'Content-Type': 'text/html', 'Set-Cookie': 'session=secret; HttpOnly' },
  });
  assert.strictEqual(
    withCulturePageEdgeCache(new Request('https://culturewalk.gangmin.dev/map'), personalizedResponse),
    personalizedResponse
  );
});

test('Workers Cache is version isolated and culture routes opt into edge-only cache directives', async () => {
  const [wrangler, worker, edgeCache, scheduledJobs, feed, viewport, detail, list] = await Promise.all([
    readProjectFile('../wrangler.jsonc'),
    readProjectFile('../worker.js'),
    readProjectFile('../src/server/cultureEdgeCache.ts'),
    readProjectFile('../src/server/cultureScheduledJobs.ts'),
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
  assert.match(worker, /manual-sync/);
  assert.match(edgeCache, /ctx\.cache\.purge/);
  assert.match(edgeCache, /Cloudflare-CDN-Cache-Control/);
  assert.match(scheduledJobs, /snapshot-\$\{trigger\}/);
  assert.match(scheduledJobs, /detail-refresh/);
});
