import {
  hasStaleCachedTourApiDetails,
  publishCurrentCultureDetailReadModels,
  refreshCulturePublicReadModelsAfterDetailRefresh,
  refreshStaleCachedTourApiDetails,
  requestCultureDetailRefresh,
} from '@/services/cultureSyncDetails';
import type { CultureCacheBinding } from '@/cache/kv';
import { D1Binding, D1Statement } from '@/services/cultureSyncTypes';

import assert from 'node:assert/strict';
import test from 'node:test';

const staleRow = {
  id: 42,
  sourceKey: 'tourapi:123',
  registrationDate: '2026-07-01T00:00:00.000Z',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  detailSyncFailCount: 2,
};

test('partial detail responses preserve stored data and schedule a retry', async () => {
  const originalFetch = globalThis.fetch;
  const executed: Array<{ query: string; values: unknown[] }> = [];
  const batches: D1Statement[][] = [];

  const createStatement = (query: string, values: unknown[] = []): D1Statement => ({
    bind: (...nextValues) => createStatement(query, nextValues),
    run: async () => {
      executed.push({ query, values });
      return {};
    },
    all: async () => {
      executed.push({ query, values });
      return query.includes('detailSyncFailCount') ? { results: [staleRow] } : { results: [] };
    },
  });

  const d1: D1Binding = {
    prepare: query => createStatement(query),
    batch: async statements => {
      batches.push(statements);
      return statements.map(() => ({}));
    },
  };

  globalThis.fetch = (async input => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input : input.url);
    if (url.pathname.endsWith('/detailIntro2')) {
      return Response.json({
        response: {
          header: { resultCode: '9999', resultMsg: 'temporary failure' },
          body: { items: { item: [] }, totalCount: 0 },
        },
      });
    }

    return Response.json({
      response: {
        header: { resultCode: '0000', resultMsg: 'OK' },
        body: { items: { item: [{}] }, totalCount: 1 },
      },
    });
  }) as typeof fetch;

  try {
    const result = await refreshStaleCachedTourApiDetails(
      { baseUrl: 'https://apis.data.go.kr/B551011/KorService2', serviceKey: 'key' },
      d1
    );

    assert.equal(result.refreshed, 0);
    assert.deepEqual(result.refreshedCultureIds, []);
    assert.equal(batches.length, 0);

    const retryUpdate = executed.find(call => call.query.includes('detail_sync_fail_count = ?'));
    assert.equal(retryUpdate?.values[0], 3);
    assert.match(String(retryUpdate?.values[2]), /일부 조회로 저장하지 않습니다/);
    assert.equal(retryUpdate?.values[3], 'tourapi:123');
    assert.ok(!executed.some(call => call.query.includes('INSERT INTO culture_tour_api_details')));
    assert.ok(!executed.some(call => call.query.includes('homepage_detail_address = ?')));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('successful detail refresh publishes a rich KV detail read model', async () => {
  const originalFetch = globalThis.fetch;
  const writes: Array<{ key: string; value: string }> = [];

  const createStatement = (query: string, values: unknown[] = []): D1Statement => ({
    bind: (...nextValues) => createStatement(query, nextValues),
    run: async () => ({}),
    all: async () =>
      query.includes('detailSyncFailCount')
        ? {
            results: [
              {
                ...staleRow,
                classification: '축제',
                date: '2026.09.10 ~ 2026.09.12',
                endDate: '2026-09-12T00:00:00.000Z',
                guName: '서울 중구',
                isFree: '정보 없음',
                lat: 37.56,
                lng: 126.98,
                mainImage: '/event.jpg',
                place: '서울광장',
                startDate: '2026-09-10T00:00:00.000Z',
                title: '테스트 축제',
                useFee: '요금 정보 확인 필요',
                createdAt: '2026-09-01T00:00:00.000Z',
                updatedAt: '2026-09-01T00:00:00.000Z',
              },
            ],
          }
        : { results: [] },
  });
  const d1: D1Binding = {
    prepare: query => createStatement(query),
    batch: async statements => statements.map(() => ({})),
  };
  const cache: CultureCacheBinding = {
    get: async key =>
      key === 'cultures:read-model:v1'
        ? {
            cachedAt: '2026-09-10T00:10:00.000Z',
            items: [
              {
                id: 42,
                classification: '축제',
                endDate: '2026-09-12T00:00:00.000Z',
                guName: '서울 중구',
                isFree: '정보 없음',
                lat: 37.56,
                lng: 126.98,
                mainImage: '/event.jpg',
                place: '서울광장',
                startDate: '2026-09-10T00:00:00.000Z',
                title: '테스트 축제',
                useFee: '요금 정보 확인 필요',
              },
            ],
            revisions: { '42': 'source-revision-42' },
          }
        : null,
    put: async (key, value) => {
      writes.push({ key, value });
    },
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
      d1,
      { cache }
    );

    assert.equal(result.refreshed, 1);
    assert.deepEqual(result.refreshedCultureIds, [42]);
    const detailWrite = writes.find(write => write.key.startsWith('cultures:detail:last:v1'));
    assert.ok(detailWrite);
    const stored = JSON.parse(detailWrite.value) as { cacheVersion: string; culture: { id: number; title: string } };
    assert.equal(stored.cacheVersion, 'source-revision-42');
    assert.equal(stored.culture.id, 42);
    assert.equal(stored.culture.title, '테스트 축제');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('detail read-model publisher skips unchanged entries with the same item revision', async () => {
  const writes: Array<{ key: string; value: string }> = [];
  const updatedAt = '2026-09-10T00:20:00.000Z';
  const createStatement = (query: string, values: unknown[] = []): D1Statement => ({
    bind: (...nextValues) => createStatement(query, nextValues),
    run: async () => ({}),
    all: async () => ({
      results: query.includes('detailSourceKey')
        ? [{ id: 42, updatedAt, detailSourceKey: 'tourapi:123' }]
        : [],
    }),
  });
  const d1: D1Binding = {
    prepare: query => createStatement(query),
    batch: async statements => statements.map(() => ({})),
  };
  const cache: CultureCacheBinding = {
    get: async key =>
      key.startsWith('cultures:detail:last:v1')
        ? { cacheVersion: 'source-revision-42', culture: { id: 42, updatedAt } }
        : null,
    put: async (key, value) => {
      writes.push({ key, value });
    },
  };

  const result = await publishCurrentCultureDetailReadModels(
    d1,
    cache,
    { '42': 'source-revision-42' }
  );

  assert.deepEqual(result, { attempted: 1, published: 0, skipped: 1 });
  assert.equal(writes.length, 0);
});

test('detail read-model publisher preserves joined detail fields when normalizing the content row', async () => {
  const writes: Array<{ key: string; value: string }> = [];
  const updatedAt = '2026-09-10T00:20:00.000Z';
  const createStatement = (query: string, values: unknown[] = []): D1Statement => ({
    bind: (...nextValues) => createStatement(query, nextValues),
    run: async () => ({}),
    all: async () => ({
      results: query.includes('detailSourceKey')
        ? [
            {
              id: 42,
              sourceKey: 'tourapi:123',
              classification: '축제',
              date: '2026.09.10 ~ 2026.09.12',
              endDate: '2026-09-12T00:00:00.000Z',
              guName: '서울 중구',
              isFree: '무료',
              lat: 37.56,
              lng: 126.98,
              mainImage: '/event.jpg',
              place: '서울광장',
              registrationDate: '2026-09-01T00:00:00.000Z',
              startDate: '2026-09-10T00:00:00.000Z',
              title: '테스트 축제',
              useFee: '무료',
              createdAt: '2026-09-01T00:00:00.000Z',
              updatedAt,
              detailSourceKey: 'tourapi:123',
              detailSourceModifiedAt: '2026-09-01T00:00:00.000Z',
              detailCommonJson: JSON.stringify({ overview: '상세 설명' }),
              detailIntroJson: '{}',
              detailInfoJson: '[]',
              detailImagesJson: '[]',
              detailIsComplete: 1,
              detailSyncedAt: updatedAt,
            },
          ]
        : [],
    }),
  });
  const d1: D1Binding = {
    prepare: query => createStatement(query),
    batch: async statements => statements.map(() => ({})),
  };
  const cache: CultureCacheBinding = {
    get: async () => null,
    put: async (key, value) => {
      writes.push({ key, value });
    },
  };

  const result = await publishCurrentCultureDetailReadModels(d1, cache, { '42': 'source-revision-42' });

  assert.deepEqual(result, { attempted: 1, published: 1, skipped: 0 });
  assert.equal(writes.length, 1);
  const stored = JSON.parse(writes[0].value) as {
    cacheVersion: string;
    culture: { id: number; title: string; overview: string };
  };
  assert.equal(stored.cacheVersion, 'source-revision-42');
  assert.equal(stored.culture.id, 42);
  assert.equal(stored.culture.title, '테스트 축제');
  assert.equal(stored.culture.overview, '상세 설명');
});

test('successful detail refresh republishes the shared list and aligns detail cache revisions', async () => {
  const updatedAt = '2026-09-30T02:00:00.000Z';
  const commonJson = JSON.stringify({ overview: '상세 공연 안내' });
  const introJson = JSON.stringify({ usetimefestival: '체험비 5,000원', program: '예약 프로그램' });
  const listRow = {
    id: 42,
    classification: '축제',
    endDate: '2026-10-05T00:00:00.000Z',
    guName: '서울 중구',
    isFree: '부분 무료',
    lat: 37.56,
    lng: 126.98,
    mainImage: '/event.jpg',
    place: '서울광장',
    startDate: '2026-10-01T00:00:00.000Z',
    title: '테스트 축제',
    useFee: '체험비 5,000원',
    sourceModifiedAt: '2026-09-01T00:00:00.000Z',
    programIntroduction: '예약 프로그램',
    useTarget: '누구나',
    organizationName: '테스트 기관',
    themeClassification: '지역축제',
    overview: '상세 공연 안내',
  };
  const detailRow = {
    ...listRow,
    sourceKey: 'tourapi:123',
    date: '2026.10.01 ~ 2026.10.05',
    etcDescription: '문의 02-0000-0000',
    homepageDetailAddress: '',
    homepageAddress: '',
    registrationDate: '2026-09-01T00:00:00.000Z',
    register: '테스트 기관',
    performerInformation: '오전 10시~오후 6시',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt,
    detailSourceKey: 'tourapi:123',
    detailSourceModifiedAt: '2026-09-01T00:00:00.000Z',
    detailCommonJson: commonJson,
    detailIntroJson: introJson,
    detailInfoJson: '[]',
    detailImagesJson: '[]',
    detailIsComplete: 1,
    detailSyncedAt: updatedAt,
  };
  const createStatement = (query: string): D1Statement => ({
    bind: () => createStatement(query),
    run: async () => ({}),
    all: async () => ({
      results: query.includes('json_extract(details.common_json')
        ? [listRow]
        : query.includes('detailSourceKey')
          ? [detailRow]
          : [],
    }),
  });
  const d1: D1Binding = {
    prepare: query => createStatement(query),
    batch: async statements => statements.map(() => ({})),
  };
  const values = new Map<string, string>([
    [
      'cultures:read-model:v1',
      JSON.stringify({
        cachedAt: '2026-09-29T00:00:00.000Z',
        items: [
          {
            id: 42,
            classification: '축제',
            endDate: '2026-10-05T00:00:00.000Z',
            guName: '서울 중구',
            isFree: '무료',
            lat: 37.56,
            lng: 126.98,
            mainImage: '/event.jpg',
            place: '서울광장',
            startDate: '2026-10-01T00:00:00.000Z',
            title: '테스트 축제',
            useFee: '무료',
            searchText: '오래된 프로그램',
          },
        ],
        revisions: { '42': 'old-revision' },
      }),
    ],
  ]);
  const cache: CultureCacheBinding = {
    get: async (key, type) => {
      const value = values.get(key);
      if (value === undefined) return null;
      return type === 'json' ? JSON.parse(value) : value;
    },
    put: async (key, value) => {
      values.set(key, value);
    },
  };

  const publication = await refreshCulturePublicReadModelsAfterDetailRefresh(d1, cache);

  assert.equal(publication.published, true);
  assert.equal(publication.detailReadModel?.published, 1);
  const item = publication.items.find(candidate => candidate.id === 42);
  assert.equal(item?.isFree, '부분 무료');
  assert.equal(item?.useFee, '체험비 5,000원');
  assert.match(item?.searchText ?? '', /상세 공연 안내/);
  assert.notEqual(publication.revisions['42'], 'old-revision');
  const detailWrite = Array.from(values.entries()).find(([key]) => key.startsWith('cultures:detail:last:v1'));
  assert.ok(detailWrite);
  const storedDetail = JSON.parse(detailWrite[1]) as { cacheVersion: string };
  assert.equal(storedDetail.cacheVersion, publication.revisions['42']);
});

test('detail refresh requests respect a cooldown and retry backoff', async () => {
  const executed: Array<{ query: string; values: unknown[] }> = [];
  const createStatement = (query: string, values: unknown[] = []): D1Statement => ({
    bind: (...nextValues) => createStatement(query, nextValues),
    run: async () => {
      executed.push({ query, values });
      return {};
    },
    all: async () => ({ results: [] }),
  });
  const d1: D1Binding = {
    prepare: query => createStatement(query),
    batch: async statements => statements.map(() => ({})),
  };

  await requestCultureDetailRefresh(d1, 'tourapi:123');

  assert.equal(executed.length, 1);
  assert.equal(executed[0].values[0], 'tourapi:123');
  assert.match(executed[0].query, /detail_next_retry_at IS NULL/);
  assert.match(executed[0].query, /detail_refresh_requested_at IS NULL/);
  assert.match(executed[0].query, /datetime\('now', '-5 minutes'\)/);
});

test('detail refresh preflight avoids lock writes when there is no pending detail work', async () => {
  const executed: string[] = [];
  const createStatement = (query: string): D1Statement => ({
    bind: () => createStatement(query),
    run: async () => {
      executed.push(query);
      return {};
    },
    all: async () => {
      executed.push(query);
      return { results: [] };
    },
  });
  const d1: D1Binding = {
    prepare: query => createStatement(query),
    batch: async statements => statements.map(() => ({})),
  };

  assert.equal(await hasStaleCachedTourApiDetails(d1), false);
  assert.equal(executed.length, 1);
  assert.match(executed[0], /SELECT 1 AS pending/);
  assert.doesNotMatch(executed[0], /INSERT INTO initialize_sync_locks/);
});
