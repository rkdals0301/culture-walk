import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

test('FeedFilterRail은 스크롤 시 텍스트 가독성과 렌더링 성능을 위해 backdrop-blur 대신 솔리드 표면을 사용한다', () => {
  const feedFilterRail = readFileSync(
    resolve(__dirname, '../src/components/Feed/FeedFilterRail.tsx'),
    'utf-8'
  );

  assert.ok(
    !feedFilterRail.includes('backdrop-blur-md'),
    'FeedFilterRail must not use backdrop-blur-md to avoid visual noise behind filter chips'
  );
  assert.ok(
    feedFilterRail.includes('bg-[var(--color-surface-primary)]'),
    'FeedFilterRail must use solid surface primary background'
  );
});

test('FeedView와 CultureList는 리스트 스크롤 시 탑으로 이동할 수 있는 스크롤 탑 버튼을 제공한다', () => {
  const feedView = readFileSync(
    resolve(__dirname, '../src/components/Feed/FeedView.tsx'),
    'utf-8'
  );
  assert.match(feedView, /ScrollToTopButton/, 'FeedView must include ScrollToTopButton');
  assert.match(feedView, /handleScrollToTop/, 'FeedView must provide scrollToTop handler');

  const cultureList = readFileSync(
    resolve(__dirname, '../src/components/Header/CultureList.tsx'),
    'utf-8'
  );
  assert.match(cultureList, /handleScrollToTop/, 'CultureList must provide scrollToTop handler');
  assert.match(cultureList, /showScrollTop/, 'CultureList must track scroll top visibility');
});

test('FeedView는 활성화된 내 주변 위치를 다시 클릭했을 때 위치를 끄고 정렬을 기본값으로 복귀한다', () => {
  const feedView = readFileSync(
    resolve(__dirname, '../src/components/Feed/FeedView.tsx'),
    'utf-8'
  );
  assert.match(
    feedView,
    /if\s*\(\s*currentLocation\s*\)\s*\{[\s\S]*?setCurrentLocation\(null\);[\s\S]*?setMapSortMode\('date'\);/,
    'FeedView must reset currentLocation to null and revert sort mode to date when location is toggled off'
  );
});

test('FeedFilterRail은 위치 토글 버튼에 토글 상태(aria-pressed)와 해제 안내 라벨을 제공한다', () => {
  const feedFilterRail = readFileSync(
    resolve(__dirname, '../src/components/Feed/FeedFilterRail.tsx'),
    'utf-8'
  );
  assert.match(feedFilterRail, /aria-pressed=\{Boolean\(currentLocation\)\}/);
  assert.match(feedFilterRail, /currentLocation \? '내 주변 해제' : '내 위치'/);
});

test('CultureContext resetMapFilters는 필터 초기화 시 currentLocation도 함께 초기화한다', () => {
  const context = readFileSync(
    resolve(__dirname, '../src/context/CultureContext.tsx'),
    'utf-8'
  );
  assert.match(
    context,
    /resetMapFilters = useCallback\(\(\) => \{[\s\S]*?updateCurrentLocation\(null\);/,
    'resetMapFilters must clear currentLocation via updateCurrentLocation(null)'
  );
});
