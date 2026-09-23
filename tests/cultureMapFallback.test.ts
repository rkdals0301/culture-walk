import assert from 'node:assert/strict';
import test from 'node:test';

import { buildCultureMapResponseFromSnapshot } from '@/services/cultureMap';
import type { CultureSearchableListItem } from '@/types/culture';

const item = (overrides: Partial<CultureSearchableListItem>): CultureSearchableListItem => ({
  id: 1,
  classification: '공연',
  endDate: new Date('2026-10-10T00:00:00.000Z'),
  guName: '서울 종로구',
  isFree: '무료',
  lat: 37.57,
  lng: 126.98,
  mainImage: '',
  place: '광화문',
  startDate: new Date('2026-09-01T00:00:00.000Z'),
  title: '테스트 공연',
  useFee: '무료',
  searchText: '테스트 공연\n서울 종로구\n광화문',
  ...overrides,
});

const filters = {
  searchQuery: '',
  category: 'all' as const,
  region: 'all',
  freeOnly: false,
};

test('KV read model 지도 목록은 snapshot에서 현재 bounds만 반환한다', () => {
  const response = buildCultureMapResponseFromSnapshot(
    [item({ id: 1 }), item({ id: 2, lat: 35.18, lng: 129.07, guName: '부산 중구' })],
    {
      filters,
      bounds: { swLat: 37.4, swLng: 126.8, neLat: 37.8, neLng: 127.2 },
      level: 7,
    }
  );

  assert.equal(response.isClustered, false);
  assert.deepEqual(response.items.map(culture => culture.id), [1]);
  assert.equal(response.totalCount, 2);
  assert.equal(response.viewportCount, 1);
});

test('KV read model 지도 cluster는 같은 grid의 행사를 하나로 묶는다', () => {
  const response = buildCultureMapResponseFromSnapshot(
    [item({ id: 1, lat: 37.51, lng: 126.91 }), item({ id: 2, lat: 37.62, lng: 127.02 })],
    {
      filters,
      bounds: { swLat: 37.4, swLng: 126.8, neLat: 37.8, neLng: 127.2 },
      level: 10,
    }
  );

  assert.equal(response.isClustered, true);
  assert.equal(response.items.length, 0);
  assert.equal(response.viewportCount, 2);
  assert.equal(response.clusters.reduce((sum, cluster) => sum + cluster.count, 0), 2);
});

test('KV read model 지도도 검색·지역·무료 필터를 동일하게 적용한다', () => {
  const response = buildCultureMapResponseFromSnapshot(
    [
      item({ id: 1, title: '서울 무료 공연', searchText: '서울 무료 공연\n서울 종로구\n광화문' }),
      item({
        id: 2,
        title: '서울 유료 공연',
        isFree: '',
        useFee: '10,000원',
        searchText: '서울 유료 공연\n서울 종로구\n광화문',
      }),
      item({ id: 3, title: '부산 무료 공연', guName: '부산 중구', searchText: '부산 무료 공연\n부산 중구\n광화문' }),
    ],
    {
      filters: { searchQuery: '무료', category: 'performance', region: '서울', freeOnly: true },
      bounds: { swLat: 33, swLng: 124, neLat: 39, neLng: 132 },
      level: 7,
    }
  );

  assert.deepEqual(response.items.map(culture => culture.id), [1]);
  assert.equal(response.totalCount, 1);
});

test('지도 목록 검색도 피드의 검색 관련도 순서를 유지한다', () => {
  const response = buildCultureMapResponseFromSnapshot(
    [
      item({
        id: 1,
        title: '다른 행사',
        startDate: new Date('2026-09-01T00:00:00.000Z'),
        searchText: '다른 행사\n서울 종로구\n광화문\n별빛 축제 소개',
      }),
      item({
        id: 2,
        title: '별빛 축제',
        startDate: new Date('2026-09-20T00:00:00.000Z'),
        searchText: '별빛 축제\n서울 종로구\n광화문',
      }),
    ],
    {
      filters: { searchQuery: '별빛 축제', category: 'all', region: 'all', freeOnly: false },
      bounds: { swLat: 37.4, swLng: 126.8, neLat: 37.8, neLng: 127.2 },
      level: 7,
    }
  );

  assert.deepEqual(response.items.map(culture => culture.id), [2, 1]);
});
