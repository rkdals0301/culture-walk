import assert from 'node:assert/strict';
import test from 'node:test';

import { createCultureFeedClientCache } from '../src/utils/cultureFeedClientCache';

const value = (totalCount: number) => ({
  cultures: [],
  totalCount,
  freeCount: 0,
  regionOptions: [],
  nextCursor: null,
  hasMore: false,
});

test('피드 클라이언트 캐시는 TTL이 지난 엔트리를 반환하지 않는다', () => {
  let now = 100;
  const cache = createCultureFeedClientCache({ ttlMs: 10, now: () => now });

  cache.write('all', value(1));
  assert.equal(cache.read('all')?.totalCount, 1);

  now = 111;
  assert.equal(cache.read('all'), null);
});

test('피드 클라이언트 캐시는 최근 사용 엔트리를 유지하는 bounded LRU로 동작한다', () => {
  const cache = createCultureFeedClientCache({ maxEntries: 2 });

  cache.write('a', value(1));
  cache.write('b', value(2));
  assert.equal(cache.read('a')?.totalCount, 1);

  cache.write('c', value(3));

  assert.equal(cache.read('b'), null);
  assert.equal(cache.read('a')?.totalCount, 1);
  assert.equal(cache.read('c')?.totalCount, 3);
});

test('피드 클라이언트 캐시는 재조회가 필요한 키만 무효화할 수 있다', () => {
  const cache = createCultureFeedClientCache();
  cache.write('a', value(1));
  cache.write('b', value(2));

  cache.invalidate('a');

  assert.equal(cache.read('a'), null);
  assert.equal(cache.read('b')?.totalCount, 2);
});
