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
