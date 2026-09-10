import {
  readCultureReadModelCache,
  type CultureCacheBinding,
  writeCultureReadModelCache,
} from '@/cache/kv';
import { refreshStaleCachedTourApiDetails } from '@/services/cultureSyncDetails';
import type { D1Binding, D1Statement } from '@/services/cultureSyncTypes';

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const makeListItem = (title: string) => ({
  id: 101,
  classification: '축제',
  endDate: new Date('2099-09-12T00:00:00.000Z'),
  guName: '서울 중구',
  isFree: '무료',
  lat: 37.56,
  lng: 126.98,
  mainImage: 'https://example.com/event.jpg',
  place: '서울광장',
  startDate: new Date('2099-09-10T00:00:00.000Z'),
  title,
  useFee: '무료',
});

test('read model reuses the same KV binding from isolate memory for 60 seconds', async () => {
  let reads = 0;
  const cache: CultureCacheBinding = {
    get: async key => {
      reads += 1;
      return key === 'cultures:read-model:v1'
        ? {
            cachedAt: '2099-09-10T00:10:00.000Z',
            items: [makeListItem('메모리 캐시 행사')],
            revisions: { '101': 'revision-101' },
          }
        : null;
    },
    put: async () => undefined,
  };

  const first = await readCultureReadModelCache(cache);
  const second = await readCultureReadModelCache(cache);

  assert.equal(first?.items[0].title, '메모리 캐시 행사');
  assert.equal(second?.items[0].title, '메모리 캐시 행사');
  assert.equal(reads, 1);
});

test('publishing a new read model immediately replaces isolate memory for that binding', async () => {
  let reads = 0;
  const cache: CultureCacheBinding = {
    get: async key => {
      reads += 1;
      return key === 'cultures:read-model:v1'
        ? {
            cachedAt: '2099-09-10T00:10:00.000Z',
            items: [makeListItem('이전 행사')],
            revisions: { '101': 'old-revision' },
          }
        : null;
    },
    put: async () => undefined,
  };

  const before = await readCultureReadModelCache(cache);
  const publication = await writeCultureReadModelCache(
    [makeListItem('새 행사')],
    { '101': 'new-revision' },
    cache
  );
  const after = await readCultureReadModelCache(cache);

  assert.equal(before?.items[0].title, '이전 행사');
  assert.equal(publication.published, true);
  assert.equal(after?.items[0].title, '새 행사');
  assert.equal(after?.revisions?.['101'], 'new-revision');
  assert.equal(reads, 1);
});

test('detail refresh reports only successfully refreshed culture ids for precise edge purge', async () => {
  const originalFetch = globalThis.fetch;
  const staleRow = {
    id: 42,
    sourceKey: 'tourapi:123',
    registrationDate: '2026-07-01T00:00:00.000Z',
    detailSyncFailCount: 0,
  };

  const createStatement = (query: string, values: unknown[] = []): D1Statement => ({
    bind: (...nextValues) => createStatement(query, nextValues),
    run: async () => ({}),
    all: async () => ({ results: query.includes('detailSyncFailCount') ? [staleRow] : [] }),
  });
  const d1: D1Binding = {
    prepare: query => createStatement(query),
    batch: async statements => statements.map(() => ({})),
  };

  globalThis.fetch = (async () =>
    Response.json({
      response: {
        header: { resultCode: '0000', resultMsg: 'OK' },
        body: { items: { item: [{}] }, totalCount: 1 },
      },
    })) as typeof fetch;

  try {
    const result = await refreshStaleCachedTourApiDetails(
      { baseUrl: 'https://apis.data.go.kr/B551011/KorService2', serviceKey: 'key' },
      d1
    );

    assert.equal(result.refreshed, 1);
    assert.deepEqual(result.refreshedCultureIds, [42]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('detail cron uses per-culture tags instead of broad public cache purge', async () => {
  const worker = await readFile(fileURLToPath(new URL('../worker.js', import.meta.url)), 'utf8');

  assert.match(worker, /refreshedCultureIds/);
  assert.match(worker, /map\(getCultureDetailEdgeCacheTag\)/);
  assert.doesNotMatch(
    worker,
    /purgeCultureEdgeCache\(ctx, \[CULTURE_EDGE_CACHE_TAGS\.all, CULTURE_EDGE_CACHE_TAGS\.detail\], 'detail-refresh'\)/
  );
});
