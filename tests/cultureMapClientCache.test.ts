import assert from 'node:assert/strict';
import test from 'node:test';

import type { CultureMapResponse } from '../src/types/culture';
import {
  createCultureMapClientCache,
  normalizeCultureMapResponse,
  selectCultureMapViewport,
} from '../src/utils/cultureMapClientCache';

const largeBounds = { swLat: 35, swLng: 126, neLat: 38, neLng: 130 };
const mediumBounds = { swLat: 36, swLng: 126.5, neLat: 37.5, neLng: 129 };
const smallBounds = { swLat: 36.5, swLng: 127, neLat: 37, neLng: 128 };

const response = (totalCount: number): CultureMapResponse => ({
  items: [],
  clusters: [],
  isClustered: true,
  totalCount,
  viewportCount: totalCount,
  regionOptions: [],
});

test('지도 클라이언트 캐시는 현재 viewport를 포함하는 가장 작은 bounds를 재사용한다', () => {
  const cache = createCultureMapClientCache();
  cache.write('all', 'clusters', largeBounds, response(10));
  cache.write('all', 'clusters', mediumBounds, response(5));

  assert.equal(cache.read('all', smallBounds, 'clusters')?.totalCount, 5);
});

test('지도 클라이언트 캐시는 TTL과 최대 엔트리 수를 독립적으로 관리한다', () => {
  let now = 100;
  const cache = createCultureMapClientCache({ ttlMs: 10, maxEntries: 2, now: () => now });
  const boundsA = { swLat: 35, swLng: 126, neLat: 36, neLng: 127 };
  const boundsB = { swLat: 36, swLng: 127, neLat: 37, neLng: 128 };
  const boundsC = { swLat: 37, swLng: 128, neLat: 38, neLng: 129 };

  cache.write('a', 'items', boundsA, response(1));
  cache.write('b', 'items', boundsB, response(2));
  cache.write('c', 'items', boundsC, response(3));

  assert.equal(cache.read('a', boundsA, 'items'), null);
  assert.equal(cache.read('c', boundsC, 'items')?.totalCount, 3);

  now = 111;
  assert.equal(cache.read('c', boundsC, 'items'), null);
});

test('지도 응답 정규화와 현재 viewport projection은 hook 밖의 순수 로직으로 유지된다', () => {
  const normalized = normalizeCultureMapResponse({ totalCount: 1 });
  assert.deepEqual(normalized, {
    items: [],
    clusters: [],
    isClustered: false,
    totalCount: 1,
    viewportCount: 0,
    regionOptions: [],
  });

  const projected = selectCultureMapViewport(
    {
      items: [],
      clusters: [
        { id: 'inside', lat: 36.75, lng: 127.5, count: 2 },
        { id: 'outside', lat: 35, lng: 125, count: 4 },
      ],
      isClustered: true,
      totalCount: 6,
      viewportCount: 6,
      regionOptions: ['서울'],
    },
    smallBounds
  );

  assert.equal(projected.clusters.length, 1);
  assert.equal(projected.clusters[0]?.id, 'inside');
  assert.equal(projected.viewportCount, 2);
});
