import type { CultureSearchableListItem } from '@/types/culture';
import {
  buildCultureFeedResult,
  createCultureFeedCursor,
  createCultureFeedFilterKey,
  createCultureFeedSnapshotRevision,
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
  const result = buildCultureFeedResult(items, {
    searchQuery: '콘서트',
    category: 'performance',
    region: '서울',
    freeOnly: true,
  });

  assert.deepEqual(result.items.map(item => item.id), [1]);
});

test('문화 피드 검색은 상세 소개와 이용 대상이 포함된 search text를 사용한다', () => {
  const searchable = createCulture({
    id: 4,
    title: '가을 행사',
    searchText: '가을 행사\n서울광장\n전통 공예를 직접 만들어보는 프로그램\n초등학생 이상',
  });

  assert.deepEqual(
    buildCultureFeedResult([searchable], {
      searchQuery: '전통 공예',
      category: 'all',
      region: 'all',
      freeOnly: false,
    }).items.map(item => item.id),
    [4]
  );
  assert.deepEqual(
    buildCultureFeedResult([searchable], {
      searchQuery: '초등학생',
      category: 'all',
      region: 'all',
      freeOnly: false,
    }).items.map(item => item.id),
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
    buildCultureFeedResult([searchable], {
      searchQuery: '서울 콘서트',
      category: 'all',
      region: 'all',
      freeOnly: false,
    }).items.map(item => item.id),
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

  const result = buildCultureFeedResult(ranked, {
    searchQuery: '별빛 축제',
    category: 'all',
    region: 'all',
    freeOnly: false,
  });

  assert.deepEqual(result.items.map(item => item.id), [12, 11, 10]);
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

  const result = buildCultureFeedResult(ranked, {
    searchQuery: '별빛',
    category: 'all',
    region: 'all',
    freeOnly: false,
    sortMode: 'distance',
    userLat: 37.5,
    userLng: 127,
  });

  assert.deepEqual(result.items.map(item => item.id), [21, 20]);
});

test('문화 피드 무료 판정은 목록 요금 필드도 확인한다', () => {
  assert.equal(isFreeCultureListItem(createCulture({ isFree: '정보 없음', useFee: '무료 관람' })), true);
  assert.equal(isFreeCultureListItem(createCulture({ isFree: '유료', useFee: '10,000원' })), false);
});

test('무료 필터는 전액 무료만 포함하고 부분 무료는 분리한다', () => {
  const free = createCulture({ id: 31, isFree: '무료', useFee: '무료 입장' });
  const partial = createCulture({ id: 32, isFree: '부분 무료', useFee: '성인 5,000원, 어린이 무료' });
  const filters = { searchQuery: '', category: 'all' as const, region: 'all', freeOnly: true };

  assert.equal(isFreeCultureListItem(partial), false);
  assert.deepEqual(buildCultureFeedResult([free, partial], filters).items.map(item => item.id), [31]);
  assert.equal(buildCultureFeedResult([free, partial], { ...filters, freeOnly: false }).freeCount, 1);
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

test('검색 점수가 같은 행사는 입력 순서를 유지하고 원본 목록을 변경하지 않는다', () => {
  const ranked = Object.freeze([
    createCulture({ id: 42, title: '별빛 축제', searchText: '별빛 축제' }),
    createCulture({ id: 41, title: '별빛 축제', searchText: '별빛 축제' }),
    createCulture({ id: 43, title: '다른 행사', searchText: '별빛 축제 소개' }),
  ]);
  const result = buildCultureFeedResult(ranked, {
    searchQuery: '별빛 축제', category: 'all', region: 'all', freeOnly: false,
  });

  assert.deepEqual(result.items.map(item => item.id), [42, 41, 43]);
  assert.deepEqual(ranked.map(item => item.id), [42, 41, 43]);
  assert.equal(result.items[0], ranked[0]);
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

test('문화 피드 cursor는 게시 snapshot과 필터를 함께 보존한다', () => {
  const filters = { searchQuery: '전시', category: 'all' as const, region: 'all', freeOnly: false };
  const snapshot = createCultureFeedSnapshotRevision('2026-09-30T10:00:00.000Z', {}, items);
  const cursor = JSON.parse(decodeURIComponent(createCultureFeedCursor(20, filters, snapshot))) as {
    offset: number;
    filters: string;
    snapshot: string;
  };

  assert.equal(cursor.offset, 20);
  assert.equal(cursor.filters, createCultureFeedFilterKey(filters));
  assert.equal(cursor.snapshot, snapshot);
});

test('문화 피드 snapshot은 게시 시각과 read-model 내용 변경을 구분한다', () => {
  const published = createCultureFeedSnapshotRevision('2026-09-30T10:00:00.000Z', {}, items);
  const republished = createCultureFeedSnapshotRevision('2026-09-30T10:01:00.000Z', {}, items);
  assert.notEqual(published, republished);

  const revisionBased = createCultureFeedSnapshotRevision(null, { '1': 'revision-a' }, items);
  const revisionChanged = createCultureFeedSnapshotRevision(null, { '1': 'revision-b' }, items);
  assert.notEqual(revisionBased, revisionChanged);

  const contentBased = createCultureFeedSnapshotRevision(null, {}, [items[0]]);
  const contentChanged = createCultureFeedSnapshotRevision(null, {}, [
    createCulture({ ...items[0], title: '변경된 행사 제목' }),
  ]);
  assert.notEqual(contentBased, contentChanged);
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
