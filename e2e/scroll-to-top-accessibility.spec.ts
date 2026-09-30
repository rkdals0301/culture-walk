import { expect, gotoApp, test } from './support/test';

const FILTERED_MAP_URL = '/map?q=문화산책&category=performance&region=서울&free=1';

test('피드 scroll-to-top 버튼은 숨겨져 있으면 탭 순서에서 빠지고 표시되면 다시 들어온다', async ({ page }) => {
  await gotoApp(page, '/');
  await expect(page.getByRole('link', { name: /문화산책 테스트 공연 2099-/ })).toBeVisible();

  const scrollToTop = page.getByRole('button', { name: '맨 위로 스크롤' });
  await expect(scrollToTop).toHaveAttribute('tabindex', '-1');

  const feedContent = page.locator('#feed-content');
  const maximumScrollTop = await feedContent.evaluate(element => {
    element.style.height = '120px';
    element.style.flex = 'none';
    const results = element.querySelector<HTMLElement>('.feed-results-enter');
    if (results) results.style.minHeight = '900px';
    const maxScrollTop = element.scrollHeight - element.clientHeight;
    element.scrollTop = maxScrollTop;
    return maxScrollTop;
  });
  expect(maximumScrollTop).toBeGreaterThan(300);
  await expect(scrollToTop).toHaveAttribute('tabindex', '0');
});

test('지도 목록의 숨겨진 scroll-to-top 버튼은 탭 순서에 포함되지 않는다', async ({ page }) => {
  await gotoApp(page, FILTERED_MAP_URL);

  const cluster = page.getByRole('button', { name: '이 영역의 행사 2개, 확대해서 보기' });
  await expect(cluster).toBeVisible();
  await cluster.click();

  const isMobile = (page.viewportSize()?.width ?? 0) < 768;
  if (isMobile) {
    await page.getByRole('button', { name: /현재 영역 2개 보기/ }).click();
  } else {
    await page.getByRole('button', { name: /^목록 \d+$/ }).click();
  }

  const scrollToTop = page.getByRole('button', { name: '목록 맨 위로 스크롤' });
  await expect(scrollToTop).toHaveAttribute('tabindex', '-1');
});
