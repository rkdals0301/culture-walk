import { getMapStatusCopy } from '../src/components/Map/MapStatus';

import assert from 'node:assert/strict';
import test from 'node:test';

test('지도 오류 상태는 재시도와 목록 계속 보기 경로를 위한 문구를 제공한다', () => {
  const copy = getMapStatusCopy('map-error', 'timeout');

  assert.equal(copy.title, '지도를 불러오지 못했습니다.');
  assert.match(copy.detail, /시간이 초과/);
  assert.equal(copy.retryLabel, '다시 시도');
  assert.equal(copy.continueLabel, '목록으로 계속 보기');
});

test('API 오류 상태는 지도 오류와 구분되는 문구를 제공한다', () => {
  const copy = getMapStatusCopy('api-error');

  assert.equal(copy.title, '행사 데이터를 불러오지 못했습니다.');
  assert.equal(copy.retryLabel, '다시 불러오기');
  assert.equal(copy.continueLabel, undefined);
});
