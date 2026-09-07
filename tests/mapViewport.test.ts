import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MAP_CLUSTER_LEVEL,
  expandMapBounds,
  getMapDataMode,
  isBoundsWithin,
  isCoordinateWithinBounds,
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
