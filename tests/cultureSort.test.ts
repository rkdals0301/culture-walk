import assert from 'node:assert/strict';
import test from 'node:test';

import { sortCulturesByRelevantDate } from '../src/utils/cultureSort';

const referenceDate = new Date('2026-07-14T00:00:00.000Z');

test('진행 중 행사는 종료일, 예정 행사는 시작일이 가까운 순서로 정렬한다', () => {
  const cultures = [
    {
      id: 1,
      title: '장기 진행 행사',
      startDate: '2021-01-01T00:00:00.000Z',
      endDate: '2026-12-31T00:00:00.000Z',
    },
    {
      id: 2,
      title: '곧 시작하는 행사',
      startDate: '2026-07-16T00:00:00.000Z',
      endDate: '2026-07-20T00:00:00.000Z',
    },
    {
      id: 3,
      title: '오늘 종료하는 행사',
      startDate: '2026-07-01T00:00:00.000Z',
      endDate: '2026-07-14T00:00:00.000Z',
    },
  ];

  assert.deepEqual(
    sortCulturesByRelevantDate(cultures, referenceDate).map(culture => culture.id),
    [3, 2, 1]
  );
});

test('관련 날짜가 같으면 시작일과 제목으로 순서를 고정한다', () => {
  const cultures = [
    {
      id: 2,
      title: '나 행사',
      startDate: '2026-07-15T00:00:00.000Z',
      endDate: '2026-07-20T00:00:00.000Z',
    },
    {
      id: 1,
      title: '가 행사',
      startDate: '2026-07-15T00:00:00.000Z',
      endDate: '2026-07-18T00:00:00.000Z',
    },
  ];

  assert.deepEqual(
    sortCulturesByRelevantDate(cultures, referenceDate).map(culture => culture.id),
    [1, 2]
  );
});
