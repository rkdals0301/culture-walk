import { calculateDistanceMeters, formatDistance } from '../src/utils/geo';

import assert from 'node:assert/strict';
import test from 'node:test';

test('동일한 좌표의 거리는 0이다', () => {
  const point = { lat: 37.5665, lng: 126.978 };
  assert.equal(calculateDistanceMeters(point, point), 0);
});

test('서울시청과 경복궁 사이 거리를 계산한다', () => {
  const cityHall = { lat: 37.5665, lng: 126.978 };
  const gyeongbokgung = { lat: 37.5796, lng: 126.977 };
  const distance = calculateDistanceMeters(cityHall, gyeongbokgung);

  assert.ok(distance > 1400 && distance < 1600);
  assert.equal(formatDistance(distance), '1.5km');
});

test('1km 미만 거리를 10m 단위로 표시한다', () => {
  assert.equal(formatDistance(347), '350m');
});
