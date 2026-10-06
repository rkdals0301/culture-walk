import assert from 'node:assert/strict';
import test from 'node:test';

import { sortCulturesByDistance, sortCulturesByRelevantDate } from '../src/utils/cultureSort';

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

test('거리 정렬은 같은 거리의 입력 순서와 원본 항목을 유지한다', () => {
  const origin = { lat: 37.5, lng: 127 };
  const cultures = Object.freeze([
    { id: 1, lat: 35.18, lng: 129.07 },
    { id: 3, ...origin },
    { id: 2, ...origin },
    { id: 4, lat: 37.51, lng: 127.01 },
  ]);

  const sorted = sortCulturesByDistance(cultures, origin);
  assert.deepEqual(sorted.map(culture => culture.id), [3, 2, 4, 1]);
  assert.deepEqual(cultures.map(culture => culture.id), [1, 3, 2, 4]);
  assert.equal(sorted[0], cultures[1]);
  assert.deepEqual(sortCulturesByDistance([], origin), []);
});

test('날짜 정렬은 Date와 문자열을 함께 처리하고 원본 순서를 보존한다', () => {
  const cultures = Object.freeze([
    { id: 3, title: '동일 행사', startDate: referenceDate, endDate: '2026-07-15T00:00:00.000Z' },
    { id: 2, title: '동일 행사', startDate: referenceDate.toISOString(), endDate: new Date('2026-07-15T00:00:00.000Z') },
    { id: 1, title: '예정 행사', startDate: '2026-07-16T00:00:00.000Z', endDate: '2026-07-20T00:00:00.000Z' },
  ]);

  const sorted = sortCulturesByRelevantDate(cultures, referenceDate);
  assert.deepEqual(sorted.map(culture => culture.id), [2, 3, 1]);
  assert.deepEqual(cultures.map(culture => culture.id), [3, 2, 1]);
  assert.equal(sorted[0], cultures[1]);
});
