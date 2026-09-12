import assert from 'node:assert/strict';
import test from 'node:test';

import type { FormattedCultureListItem } from '../src/types/culture';
import {
  createCultureFeedClientCacheKey,
  createCultureFeedClientFilters,
  createCultureFeedRequestParams,
  mergeCultureFeedItems,
} from '../src/utils/cultureFeedClientRequest';

const item = (id: number): FormattedCultureListItem => ({
  id,
  classification: '공연',
  endDate: new Date('2026-09-30'),
  guName: '서울 종로구',
  isFree: '무료',
  lat: 37.5,
  lng: 127,
  mainImage: '',
  place: '공연장',
  startDate: new Date('2026-09-01'),
  title: `행사 ${id}`,
  useFee: '무료',
  displayDate: '2026.09.01 - 2026.09.30',
  displayPlace: '공연장',
  displayPrice: '무료',
});

test('피드 클라이언트 필터는 위치가 있을 때만 거리순 요청을 만든다', () => {
  const withoutLocation = createCultureFeedClientFilters({
    searchQuery: ' 공연 ',
    category: 'all',
    region: 'all',
    freeOnly: false,
    sortMode: 'distance',
  });
  assert.equal(withoutLocation.sortMode, 'date');
  assert.equal(withoutLocation.userLat, null);

  const withLocation = createCultureFeedClientFilters({
    searchQuery: '공연',
    category: 'all',
    region: 'all',
    freeOnly: false,
    sortMode: 'distance',
    currentLocation: { lat: 37.56654, lng: 126.978 },
  });
  assert.equal(withLocation.sortMode, 'distance');
  assert.equal(withLocation.userLat, 37.56654);
});

test('피드 요청 파라미터와 캐시 키는 같은 필터를 안정적으로 표현한다', () => {
  const filters = createCultureFeedClientFilters({
    searchQuery: '공연',
    category: 'performance',
    region: '서울',
    freeOnly: true,
    sortMode: 'distance',
    currentLocation: { lat: 37.56654, lng: 126.978 },
  });
  const params = createCultureFeedRequestParams(filters, 'cursor-1');

  assert.deepEqual(params, {
    limit: 20,
    category: 'performance',
    region: '서울',
    free: '1',
    q: '공연',
    sort: 'distance',
    lat: 37.56654,
    lng: 126.978,
    cursor: 'cursor-1',
  });
  assert.match(createCultureFeedClientCacheKey(filters), /37\.5665\|126\.9780$/);
});

test('피드 페이지 병합은 기존 id를 중복 추가하지 않는다', () => {
  const first = item(1);
  const second = item(2);
  const third = item(3);

  assert.deepEqual(mergeCultureFeedItems([first, second], [second, third], true).map(value => value.id), [1, 2, 3]);
  assert.deepEqual(mergeCultureFeedItems([first], [second], false).map(value => value.id), [2]);
});
