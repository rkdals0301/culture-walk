import {
  getLocationStatus,
  getMapFilterSignature,
  parseMapExploreStateFromSearch,
  serializeMapExploreStateToSearch,
  type MapFilterState,
  type MapExploreUrlState,
} from '@/utils/exploreState';

import assert from 'node:assert/strict';
import test from 'node:test';

const baseState: MapFilterState = {
  searchQuery: '',
  mapCategory: 'all',
  mapRegion: 'all',
  mapFreeOnly: false,
  sortMode: 'date',
};

test('탐색 조건의 모든 값이 바뀌면 상태 서명도 바뀐다', () => {
  assert.notEqual(getMapFilterSignature(baseState), getMapFilterSignature({ ...baseState, searchQuery: '공연' }));
  assert.notEqual(getMapFilterSignature(baseState), getMapFilterSignature({ ...baseState, mapCategory: 'performance' }));
  assert.notEqual(getMapFilterSignature(baseState), getMapFilterSignature({ ...baseState, mapRegion: '종로구' }));
  assert.notEqual(getMapFilterSignature(baseState), getMapFilterSignature({ ...baseState, mapFreeOnly: true }));
  assert.notEqual(getMapFilterSignature(baseState), getMapFilterSignature({ ...baseState, sortMode: 'distance' }));
});

test('위치 오류와 취소를 사용자 상태로 분류한다', () => {
  assert.equal(getLocationStatus({ code: 1 }), 'permission-denied');
  assert.equal(getLocationStatus({ code: 2 }), 'unavailable');
  assert.equal(getLocationStatus({ code: 3 }), 'timeout');
  assert.equal(getLocationStatus({ status: 'cancelled' }), 'cancelled');
  assert.equal(getLocationStatus(new Error('unknown')), 'unavailable');
});

test('탐색 URL 상태를 직렬화하고 복원하면 검색·필터·정렬·스크롤이 보존된다', () => {
  const state: MapExploreUrlState = {
    searchQuery: '공연',
    mapCategory: 'performance',
    mapRegion: '종로구',
    mapFreeOnly: true,
    sortMode: 'date',
    mapListScrollTop: 248,
    listOpen: true,
    focusCultureId: 11902,
    selectedCultureId: 11902,
  };

  assert.deepEqual(parseMapExploreStateFromSearch(`?${serializeMapExploreStateToSearch(state)}`), state);
});

test('탐색 조건이 없는 URL은 복원하지 않는다', () => {
  assert.equal(parseMapExploreStateFromSearch(''), null);
  assert.equal(parseMapExploreStateFromSearch('?foo=bar'), null);
});
