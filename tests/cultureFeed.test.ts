import type { CultureSearchableListItem } from '@/types/culture';
import {
  buildCultureFeedResult,
  createCultureFeedFilterKey,
  filterCultureListItems,
  getCultureRegionOptions,
  isFreeCultureListItem,
} from '@/services/cultureFeed';
import { filterCurrentCultureListItems } from '@/services/cultureList';

import assert from 'node:assert/strict';
import test from 'node:test';

const createCulture = (overrides: Partial<CultureSearchableListItem>): CultureSearchableListItem => ({
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
  searchText: '가을 문화행사\n서울 중구\n서울광장',
  ...overrides,
});

const items = [
  createCulture({
    id: 1,
    classification: '공연',
    title: '서울 무료 콘서트',
    isFree: '무료',
    useFee: '무료',
    searchText: '서울 무료 콘서트\n서울 중구\n서울광장',
  }),
  createCulture({
    id: 2,
    classification: '전시',
    guName: '부산 해운대구',
    title: '바다 전시',
    searchText: '바다 전시\n부산 해운대구\n서울광장',
  }),
  createCulture({
    id: 3,
    classification: '교육·체험',
    guName: '서울 마포구',
    title: '도예 체험',
    searchText: '도예 체험\n서울 마포구\n서울광장',
  }),
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

test('문화 피드 검색은 상세 소개와 이용 대상이 포함된 search text를 사용한다', () => {
  const searchable = createCulture({
    id: 4,
    title: '가을 행사',
    searchText: '가을 행사\n서울광장\n전통 공예를 직접 만들어보는 프로그램\n초등학생 이상',
  });

  assert.deepEqual(
    filterCultureListItems([searchable], {
      searchQuery: '전통 공예',
      category: 'all',
      region: 'all',
      freeOnly: false,
    }).map(item => item.id),
    [4]
  );
  assert.deepEqual(
    filterCultureListItems([searchable], {
      searchQuery: '초등학생',
      category: 'all',
      region: 'all',
      freeOnly: false,
    }).map(item => item.id),
    [4]
  );
});

test('문화 피드 검색은 여러 키워드가 서로 다른 필드에 있어도 모두 매칭한다', () => {
  const searchable = createCulture({
    id: 5,
    title: '가을 콘서트',
    guName: '서울 마포구',
    place: '월드컵공원',
    searchText: '가을 콘서트\n서울 마포구\n월드컵공원\n야외 음악 행사',
  });

  assert.deepEqual(
    filterCultureListItems([searchable], {
      searchQuery: '서울 콘서트',
      category: 'all',
      region: 'all',
      freeOnly: false,
    }).map(item => item.id),
    [5]
  );
});

test('문화 피드 검색은 제목 정확 일치와 제목 포함을 일반 상세 텍스트 일치보다 우선한다', () => {
  const ranked = [
    createCulture({
      id: 10,
      title: '다른 행사',
      searchText: '다른 행사\n서울\n광장\n별빛 축제를 소개하는 상세 설명',
    }),
    createCulture({
      id: 11,
      title: '서울 별빛 축제 특별전',
      searchText: '서울 별빛 축제 특별전\n부산\n전시장',
    }),
    createCulture({
      id: 12,
      title: '별빛 축제',
      searchText: '별빛 축제\n대구\n공원',
    }),
  ];

  const result = filterCultureListItems(ranked, {
    searchQuery: '별빛 축제',
    category: 'all',
    region: 'all',
    freeOnly: false,
  });

  assert.deepEqual(result.map(item => item.id), [12, 11, 10]);
});

test('거리순 검색에서는 검색 관련도보다 실제 거리를 우선한다', () => {
  const ranked = [
    createCulture({
      id: 20,
      title: '별빛 축제',
      lat: 37.7,
      lng: 127.2,
      searchText: '별빛 축제\n서울',
    }),
    createCulture({
      id: 21,
      title: '별빛 행사',
      lat: 37.5001,
      lng: 127.0001,
      searchText: '별빛 행사\n별빛 축제 안내\n서울',
    }),
  ];

  const result = filterCultureListItems(ranked, {
    searchQuery: '별빛',
    category: 'all',
    region: 'all',
    freeOnly: false,
    sortMode: 'distance',
    userLat: 37.5,
    userLng: 127,
  });

  assert.deepEqual(result.map(item => item.id), [21, 20]);
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

test('KV read model은 오늘 이미 종료된 행사를 제외한다', () => {
  const current = filterCurrentCultureListItems(
    [
      createCulture({ id: 1, endDate: new Date('2026-09-09T00:00:00.000Z') }),
      createCulture({ id: 2, endDate: new Date('2026-09-11T00:00:00.000Z') }),
    ],
    new Date('2026-09-10T03:00:00.000Z')
  );

  assert.deepEqual(current.map(item => item.id), [2]);
});
