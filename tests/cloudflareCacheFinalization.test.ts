import {
  getSerializedUtf8ByteLength,
  readCultureDetailCache,
  readCultureReadModelCache,
  readCultureReadModelMetadataCache,
  type CultureCacheBinding,
  writeCultureReadModelCache,
} from '@/cache/kv';
import { refreshStaleCachedTourApiDetails } from '@/services/cultureSyncDetails';
import type { D1Binding, D1Statement } from '@/services/cultureSyncTypes';
import type { Culture } from '@/types/culture';

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

test('read model byte telemetry measures UTF-8 payload size', () => {
  const value = { title: '문화산책', items: [1, 2, 3] };

  assert.equal(getSerializedUtf8ByteLength(value), Buffer.byteLength(JSON.stringify(value), 'utf8'));
});

test('read model rejects malformed rows instead of serving or caching them', async () => {
  const requestedKeys: string[] = [];
  const cache: CultureCacheBinding = {
    get: async key => {
      requestedKeys.push(key);
      if (key === 'cultures:read-model:v1') {
        return {
          cachedAt: '2099-09-10T00:10:00.000Z',
          items: [null],
          revisions: {},
        };
      }
      if (key === 'cultures:list:last:v1') return [makeListItem('오래된 fallback 행사')];
      return null;
    },
    put: async () => undefined,
  };

  const readModel = await readCultureReadModelCache(cache);

  assert.equal(readModel, null);
  assert.deepEqual(requestedKeys, ['cultures:read-model:v1']);
});

test('detail cache rejects a malformed culture payload', async () => {
  const cache: CultureCacheBinding = {
    get: async () => ({ cacheVersion: 'revision-101', culture: { id: 101 } }),
    put: async () => undefined,
  };

  assert.equal(await readCultureDetailCache(101, cache), null);
});

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

const makeCultureWithoutAddress = () =>
  ({
    id: 101,
    classification: '축제',
    date: '2099.09.10 ~ 2099.09.12',
    endDate: new Date('2099-09-12T00:00:00.000Z'),
    etcDescription: '',
    guName: '서울 중구',
    homepageDetailAddress: '',
    isFree: '무료',
    lat: 37.56,
    lng: 126.98,
    mainImage: 'https://example.com/event.jpg',
    homepageAddress: '',
    organizationName: '',
    place: '서울광장',
    performerInformation: '',
    programIntroduction: '',
    registrationDate: '',
    startDate: new Date('2099-09-10T00:00:00.000Z'),
    themeClassification: '',
    register: '',
    title: '캐시 상세 행사',
    useFee: '무료',
    useTarget: '',
    overview: '',
    eventTime: '',
    duration: '',
    bookingPlace: '',
    placeInformation: '',
    contact: '',
    festivalGrade: '',
    discountInformation: '',
    additionalInformation: [],
    additionalImages: [],
  } satisfies Omit<Culture, 'address'>);

test('KV JSON read model converts serialized date strings into validated dates', async () => {
  const item = {
    ...makeListItem('직렬화된 read model 행사'),
    startDate: '2099-09-10T00:00:00.000Z',
    endDate: '2099-09-12T00:00:00.000Z',
  };
  const cache: CultureCacheBinding = {
    get: async () => ({ cachedAt: '2099-09-10T00:10:00.000Z', items: [item], revisions: {} }),
    put: async () => undefined,
  };

  const readModel = await readCultureReadModelCache(cache);

  assert.ok(readModel);
  assert.ok(readModel.items[0].startDate instanceof Date);
  assert.ok(readModel.items[0].endDate instanceof Date);
});

test('valid serialized detail cache restores date fields and old address fallback', async () => {
  const culture = JSON.parse(JSON.stringify(makeCultureWithoutAddress())) as unknown;
  const cache: CultureCacheBinding = {
    get: async () => ({ cacheVersion: 'revision-101', culture }),
    put: async () => undefined,
  };

  const detail = await readCultureDetailCache(101, cache);

  assert.ok(detail);
  assert.ok(detail.culture.startDate instanceof Date);
  assert.ok(detail.culture.endDate instanceof Date);
  assert.equal(detail.culture.address, '서울광장');
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
  assert.ok(publication.serializedBytes > 0);
  assert.equal(after?.items[0].title, '새 행사');
  assert.equal(after?.revisions?.['101'], 'new-revision');
  assert.equal(reads, 1);
});

test('publishing a read model stores a lightweight health metadata envelope', async () => {
  const stored = new Map<string, unknown>();
  const cache: CultureCacheBinding = {
    get: async key => stored.get(key) ?? null,
    put: async (key, value) => {
      stored.set(key, JSON.parse(value));
    },
  };

  const publication = await writeCultureReadModelCache(
    [makeListItem('상태 확인 행사')],
    { '101': 'revision-101' },
    cache
  );
  const metadata = await readCultureReadModelMetadataCache(cache);

  assert.equal(publication.published, true);
  assert.equal(publication.metadataPublished, true);
  assert.equal(metadata?.itemCount, 1);
  assert.equal(metadata?.cachedAt, publication.cachedAt);
  assert.equal(metadata?.serializedBytes, publication.serializedBytes);
});

test('detail refresh reports only successfully refreshed culture ids for precise edge purge', async () => {
  const originalFetch = globalThis.fetch;
  const staleRow = {
    id: 42,
    sourceKey: 'tourapi:123',
    registrationDate: '2026-07-01T00:00:00.000Z',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
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

test('detail cron republishes the shared list and purges list plus changed detail cache tags', async () => {
  const scheduledJobs = await readFile(
    fileURLToPath(new URL('../src/server/cultureScheduledJobs.ts', import.meta.url)),
    'utf8'
  );

  assert.match(scheduledJobs, /refreshedCultureIds/);
  assert.match(scheduledJobs, /refreshCulturePublicReadModelsAfterDetailRefresh/);
  assert.match(scheduledJobs, /CULTURE_EDGE_CACHE_TAGS\.list/);
  assert.match(scheduledJobs, /map\(getCultureDetailEdgeCacheTag\)/);
});
