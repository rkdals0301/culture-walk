import assert from 'node:assert/strict';
import test from 'node:test';

import { groupItemsByCoordinate } from '@/utils/mapMarkers';

test('같은 좌표의 행사는 하나의 마커 그룹으로 묶는다', () => {
  const groups = groupItemsByCoordinate([
    { id: 1, lat: 37.5665, lng: 126.978 },
    { id: 2, lat: 37.5665, lng: 126.978 },
    { id: 3, lat: 35.1796, lng: 129.0756 },
  ]);

  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].duplicateItems.map(item => item.id), [1, 2]);
  assert.equal(groups[0].primaryItem.id, 1);
  assert.equal(groups[1].primaryItem.id, 3);
});

test('좌표 그룹 키는 소수점 6자리 기준으로 안정적으로 정규화한다', () => {
  const groups = groupItemsByCoordinate([
    { id: 1, lat: 37.12345641, lng: 127.12345641 },
    { id: 2, lat: 37.12345649, lng: 127.12345649 },
  ]);

  assert.equal(groups.length, 1);
});
