import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MAP_CLUSTER_LEVEL,
  MAP_CLUSTER_GRID_SIZE,
  MAP_ITEM_REQUEST_GRID_SIZE,
  expandMapBounds,
  getMapDataMode,
  isBoundsWithin,
  isCoordinateWithinBounds,
  snapMapBoundsOutward,
} from '../src/utils/mapViewport';

const bounds = {
  swLat: 35,
  swLng: 126,
  neLat: 37,
  neLng: 129,
};

test('지도 요청 bounds는 현재 화면보다 각 변 25%씩 넓어진다', () => {
  const expanded = expandMapBounds(bounds);

  assert.deepEqual(expanded, {
    swLat: 34.5,
    swLng: 125.25,
    neLat: 37.5,
    neLng: 129.75,
  });
  assert.equal(isBoundsWithin(bounds, expanded), true);
});

test('확장 영역 안에서 이동하면 재사용할 수 있는지 판별한다', () => {
  const expanded = expandMapBounds(bounds);

  assert.equal(isBoundsWithin({ swLat: 35.2, swLng: 126.2, neLat: 36.8, neLng: 128.8 }, expanded), true);
  assert.equal(isBoundsWithin({ swLat: 34, swLng: 126, neLat: 36, neLng: 128 }, expanded), false);
});

test('축소 레벨에서는 격자 집계, 확대 레벨에서는 행사 목록 모드를 사용한다', () => {
  assert.equal(getMapDataMode(MAP_CLUSTER_LEVEL), 'clusters');
  assert.equal(getMapDataMode(MAP_CLUSTER_LEVEL - 1), 'items');
});

test('현재 화면 안의 좌표만 표시 대상으로 선택한다', () => {
  assert.equal(isCoordinateWithinBounds(36, 127, bounds), true);
  assert.equal(isCoordinateWithinBounds(34.9, 127, bounds), false);
});

test('지도 요청 bounds는 캐시 재사용을 위해 바깥 방향 그리드로 정렬한다', () => {
  const snappedItems = snapMapBoundsOutward(
    { swLat: 37.501, swLng: 126.901, neLat: 37.549, neLng: 126.949 },
    MAP_ITEM_REQUEST_GRID_SIZE
  );
  assert.deepEqual(snappedItems, { swLat: 37.5, swLng: 126.9, neLat: 37.55, neLng: 126.95 });

  const snappedClusters = snapMapBoundsOutward(
    { swLat: 35.11, swLng: 126.01, neLat: 37.49, neLng: 129.01 },
    MAP_CLUSTER_GRID_SIZE
  );
  assert.deepEqual(snappedClusters, { swLat: 35, swLng: 126, neLat: 37.5, neLng: 129.25 });
});
