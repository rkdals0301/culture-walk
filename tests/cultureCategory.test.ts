import { getCultureTone, matchesCultureCategory } from '../src/utils/cultureCategory';

import assert from 'node:assert/strict';
import test from 'node:test';

test('문화행사 분류를 탐색 필터 그룹으로 정규화한다', () => {
  assert.equal(getCultureTone('교육/체험'), 'education');
  assert.equal(getCultureTone('전시/미술'), 'exhibition');
  assert.equal(getCultureTone('뮤지컬/오페라'), 'performance');
  assert.equal(getCultureTone('축제-문화/예술'), 'festival');
  assert.equal(getCultureTone('기타'), 'other');
});

test('전체 필터와 개별 분류 필터를 구분한다', () => {
  assert.equal(matchesCultureCategory('클래식', 'all'), true);
  assert.equal(matchesCultureCategory('클래식', 'performance'), true);
  assert.equal(matchesCultureCategory('클래식', 'exhibition'), false);
});
