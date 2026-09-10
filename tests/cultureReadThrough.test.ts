import type { CultureCacheBinding } from '@/cache/kv';
import { getCulturePublicListSnapshot } from '@/services/cultureList';
import { getCulturePublicRead } from '@/services/cultureReadModel';
import type { D1Binding, D1Statement } from '@/services/cultureSyncTypes';

import assert from 'node:assert/strict';
import test from 'node:test';

const createD1 = (resolveRows: (query: string, values: unknown[]) => Array<Record<string, unknown>>): D1Binding => {
  const createStatement = (query: string, values: unknown[] = []): D1Statement => ({
    bind: (...nextValues) => createStatement(query, nextValues),
    run: async () => ({}),
    all: async () => ({ results: resolveRows(query, values) }),
  });

  return {
    prepare: query => createStatement(query),
    batch: async statements => statements.map(() => ({})),
  };
};

const createMemoryCache = (seed: Record<string, unknown> = {}) => {
  const store = new Map<string, unknown>(Object.entries(seed));
  const writes: string[] = [];
  const cache: CultureCacheBinding = {
    get: async key => store.get(key) ?? null,
    put: async (key, value) => {
      writes.push(key);
      store.set(key, JSON.parse(value));
    },
  };

  return { cache, store, writes };
};

test('public list reads through D1 and republishes KV when the read model is missing', async () => {
  const { cache, store, writes } = createMemoryCache();
  const d1 = createD1(query =>
    query.includes('FROM cultures')
      ? [
          {
            id: 101,
            classification: '축제',
            endDate: '2099-09-12T00:00:00.000Z',
            guName: '서울 중구',
            isFree: '무료',
            lat: 37.56,
            lng: 126.98,
            mainImage: 'https://example.com/event.jpg',
            place: '서울광장',
            startDate: '2099-09-10T00:00:00.000Z',
            title: '테스트 축제',
            useFee: '무료',
            sourceModifiedAt: '2099-09-01T00:00:00.000Z',
          },
        ]
      : []
  );

  const snapshot = await getCulturePublicListSnapshot({ cache, d1 });

  assert.equal(snapshot?.source, 'd1-read-through');
  assert.equal(snapshot?.items.length, 1);
  assert.equal(snapshot?.items[0].title, '테스트 축제');
  assert.ok(writes.includes('cultures:read-model:v1'));
  const warmed = store.get('cultures:read-model:v1') as { items?: unknown[]; revisions?: Record<string, string> };
  assert.equal(warmed.items?.length, 1);
  assert.match(warmed.revisions?.['101'] ?? '', /^2099-09-01T00:00:00\.000Z:/);
});

test('public list stays on KV and does not touch D1 on a cache hit', async () => {
  let d1Reads = 0;
  const { cache } = createMemoryCache({
    'cultures:read-model:v1': {
      cachedAt: '2099-09-10T00:10:00.000Z',
      items: [
        {
          id: 101,
          classification: '축제',
          endDate: '2099-09-12T00:00:00.000Z',
          guName: '서울 중구',
          isFree: '무료',
          lat: 37.56,
          lng: 126.98,
          mainImage: 'https://example.com/event.jpg',
          place: '서울광장',
          startDate: '2099-09-10T00:00:00.000Z',
          title: '테스트 축제',
          useFee: '무료',
        },
      ],
      revisions: { '101': 'revision-101' },
    },
  });
  const d1 = createD1(() => {
    d1Reads += 1;
    return [];
  });

  const snapshot = await getCulturePublicListSnapshot({ cache, d1 });

  assert.equal(snapshot?.source, 'kv-read-model');
  assert.equal(d1Reads, 0);
});

test('detail cache miss reads one rich row from D1 and writes it through to KV', async () => {
  const revision = '2099-09-01T00:00:00.000Z:abc12345';
  const { cache, store, writes } = createMemoryCache({
    'cultures:read-model:v1': {
      cachedAt: '2099-09-10T00:10:00.000Z',
      items: [
        {
          id: 101,
          classification: '축제',
          endDate: '2099-09-12T00:00:00.000Z',
          guName: '서울 중구',
          isFree: '무료',
          lat: 37.56,
          lng: 126.98,
          mainImage: 'https://example.com/event.jpg',
          place: '서울광장',
          startDate: '2099-09-10T00:00:00.000Z',
          title: '테스트 축제',
          useFee: '무료',
        },
      ],
      revisions: { '101': revision },
    },
  });
  const d1 = createD1(query =>
    query.includes('detailSourceKey')
      ? [
          {
            id: 101,
            sourceKey: 'tourapi:101',
            classification: '축제',
            date: '2099.09.10 ~ 2099.09.12',
            endDate: '2099-09-12T00:00:00.000Z',
            etcDescription: '문의 02-0000-0000',
            guName: '서울 중구',
            homepageDetailAddress: 'https://example.com/book',
            isFree: '무료',
            lat: 37.56,
            lng: 126.98,
            mainImage: 'https://example.com/event.jpg',
            homepageAddress: 'https://example.com',
            organizationName: '테스트 주최',
            place: '서울광장',
            performerInformation: '10:00~20:00',
            programIntroduction: '기본 프로그램',
            registrationDate: '2099-09-01T00:00:00.000Z',
            startDate: '2099-09-10T00:00:00.000Z',
            themeClassification: '지역축제',
            register: '',
            title: '테스트 축제',
            useFee: '무료',
            useTarget: '누구나',
            createdAt: '2099-08-01T00:00:00.000Z',
            updatedAt: '2099-09-01T00:00:00.000Z',
            detailSourceKey: 'tourapi:101',
            detailSourceModifiedAt: '2099-09-01T00:00:00.000Z',
            detailCommonJson: JSON.stringify({ overview: '풍부한 행사 소개' }),
            detailIntroJson: JSON.stringify({ eventplace: '서울광장', usetimefestival: '무료' }),
            detailInfoJson: '[]',
            detailImagesJson: '[]',
            detailIsComplete: 1,
            detailSyncedAt: '2099-09-01T01:00:00.000Z',
          },
        ]
      : []
  );

  const result = await getCulturePublicRead(101, { cache, d1 });

  assert.equal(result.source, 'd1-read-through');
  assert.equal(result.culture?.overview, '풍부한 행사 소개');
  const detailKey = writes.find(key => key.startsWith('cultures:detail:last:v1'));
  assert.ok(detailKey);
  const warmed = store.get(detailKey) as { cacheVersion?: string; culture?: { overview?: string } };
  assert.equal(warmed.cacheVersion, revision);
  assert.equal(warmed.culture?.overview, '풍부한 행사 소개');
});

test('matching rich detail cache stays on KV and does not touch D1', async () => {
  let d1Reads = 0;
  const revision = 'revision-101';
  const listItem = {
    id: 101,
    classification: '축제',
    endDate: '2099-09-12T00:00:00.000Z',
    guName: '서울 중구',
    isFree: '무료',
    lat: 37.56,
    lng: 126.98,
    mainImage: 'https://example.com/event.jpg',
    place: '서울광장',
    startDate: '2099-09-10T00:00:00.000Z',
    title: '테스트 축제',
    useFee: '무료',
  };
  const { cache } = createMemoryCache({
    'cultures:read-model:v1': {
      cachedAt: '2099-09-10T00:10:00.000Z',
      items: [listItem],
      revisions: { '101': revision },
    },
    'cultures:detail:last:v1:{"id":101}': {
      cacheVersion: revision,
      culture: {
        ...listItem,
        date: '',
        etcDescription: '',
        homepageDetailAddress: '',
        homepageAddress: '',
        organizationName: '',
        performerInformation: '',
        programIntroduction: '',
        registrationDate: '',
        themeClassification: '',
        register: '',
        useTarget: '',
        overview: 'KV 상세 소개',
        eventTime: '',
        duration: '',
        bookingPlace: '',
        placeInformation: '',
        contact: '',
        festivalGrade: '',
        discountInformation: '',
        additionalInformation: [],
        additionalImages: [],
      },
    },
  });
  const d1 = createD1(() => {
    d1Reads += 1;
    return [];
  });

  const result = await getCulturePublicRead(101, { cache, d1 });

  assert.equal(result.source, 'kv-detail-cache');
  assert.equal(result.culture?.overview, 'KV 상세 소개');
  assert.equal(d1Reads, 0);
});
