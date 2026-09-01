import assert from 'node:assert/strict';
import test from 'node:test';

import { getMapDetailId, shouldRestoreMapList } from '@/utils/mapRoute';

test('지도 상세 경로에서만 행사 ID를 읽는다', () => {
  assert.equal(getMapDetailId('/map/746392'), 746392);
  assert.equal(getMapDetailId('/map'), null);
  assert.equal(getMapDetailId('/map/0'), null);
  assert.equal(getMapDetailId('/map/746392/extra'), null);
  assert.equal(getMapDetailId('/map/746392-extra'), null);
  assert.equal(getMapDetailId('/map/not-a-number'), null);
});

test('목록 복귀 요청을 URL 쿼리에서 구분한다', () => {
  assert.equal(shouldRestoreMapList('?list=open'), true);
  assert.equal(shouldRestoreMapList('?list=closed'), false);
  assert.equal(shouldRestoreMapList(''), false);
});
