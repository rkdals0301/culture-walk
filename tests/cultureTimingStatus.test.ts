import assert from 'node:assert/strict';
import test from 'node:test';

import { getCultureTimingStatus } from '../src/utils/cultureTimingStatus';

const referenceDate = new Date('2026-09-12T12:00:00+09:00');

test('행사 상태 계산은 종료, 당일 마감, 임박, 예정, 진행 중을 구분한다', () => {
  assert.deepEqual(getCultureTimingStatus('2026-09-01', '2026-09-11', referenceDate), {
    text: '종료',
    variant: 'ended',
  });
  assert.deepEqual(getCultureTimingStatus('2026-09-01', '2026-09-12', referenceDate), {
    text: '오늘 마감',
    variant: 'urgent',
  });
  assert.deepEqual(getCultureTimingStatus('2026-09-01', '2026-09-14', referenceDate), {
    text: 'D-2 마감임박',
    variant: 'urgent',
  });
  assert.deepEqual(getCultureTimingStatus('2026-09-20', '2026-09-30', referenceDate), {
    text: 'D-8 오픈예정',
    variant: 'upcoming',
  });
  assert.deepEqual(getCultureTimingStatus('2026-09-01', '2026-09-30', referenceDate), {
    text: '진행중',
    variant: 'ongoing',
  });
});

test('종료일이 없거나 유효하지 않으면 행사 상태를 만들지 않는다', () => {
  assert.equal(getCultureTimingStatus('2026-09-01', null, referenceDate), null);
  assert.equal(getCultureTimingStatus('2026-09-01', 'invalid-date', referenceDate), null);
});
