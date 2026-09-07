import type { CultureListItem } from '@/types/culture';
import {
  buildCultureFeedResult,
  createCultureFeedFilterKey,
  filterCultureListItems,
  getCultureRegionOptions,
  isFreeCultureListItem,
} from '@/services/cultureFeed';

import assert from 'node:assert/strict';
import test from 'node:test';

const createCulture = (overrides: Partial<CultureListItem>): CultureListItem => ({
  id: 1,
  classification: '공연',
  endDate: new Date('2026-09-30T00:00:00.000Z'),
  guName: '서울 중구',
  isFree: '유료',
  lat: 37.5,
  lng: 127,
  mainImage: '/event.jpg',
  place: '서울광장',
  startDate: new Date('2026-09-01T00:00:00.000Z'),
  title: '가을 문화행사',
  useFee: '10,000원',
  ...overrides,
});

const items = [
  createCulture({ id: 1, classification: '공연', title: '서울 무료 콘서트', isFree: '무료', useFee: '무료' }),
  createCulture({ id: 2, classification: '전시', guName: '부산 해운대구', title: '바다 전시' }),
  createCulture({ id: 3, classification: '교육·체험', guName: '서울 마포구', title: '도예 체험' }),
];

test('문화 피드 필터는 카테고리·지역·검색어·무료 조건을 함께 적용한다', () => {
  const result = filterCultureListItems(items, {
    searchQuery: '콘서트',
    category: 'performance',
    region: '서울',
    freeOnly: true,
  });

  assert.deepEqual(result.map(item => item.id), [1]);
});

test('문화 피드 무료 판정은 목록 요금 필드도 확인한다', () => {
  assert.equal(isFreeCultureListItem(createCulture({ isFree: '정보 없음', useFee: '무료 관람' })), true);
  assert.equal(isFreeCultureListItem(createCulture({ isFree: '유료', useFee: '10,000원' })), false);
});

test('문화 피드 지역 옵션은 중복 없이 한글 순서로 정렬한다', () => {
  assert.deepEqual(getCultureRegionOptions(items), ['부산', '서울']);
});

test('문화 피드 결과는 필터 목록·무료 수·지역 옵션을 한 번에 계산한다', () => {
  const result = buildCultureFeedResult(items, {
    searchQuery: '',
    category: 'all',
    region: 'all',
    freeOnly: false,
  });

  assert.deepEqual(result.items.map(item => item.id), [1, 2, 3]);
  assert.equal(result.freeCount, 1);
  assert.deepEqual(result.regionOptions, ['부산', '서울']);
});

test('문화 피드 캐시 키는 입력 공백과 과도한 검색어를 정규화한다', () => {
  const key = createCultureFeedFilterKey({
    searchQuery: `  ${'행사'.repeat(80)}  `,
    category: 'all',
    region: 'all',
    freeOnly: false,
  });

  assert.equal(JSON.parse(key).searchQuery.length, 100);
});
