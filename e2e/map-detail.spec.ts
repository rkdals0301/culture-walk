import { expect, test } from './support/test';

const FILTERED_MAP_URL = '/map?q=문화산책&category=performance&region=서울&free=1';

test('지도 cluster부터 상세 확인과 목록 복귀까지 탐색 상태를 보존한다', async ({ page }) => {
  await page.goto(FILTERED_MAP_URL);
  await expect(page.getByRole('region', { name: '전국 문화행사 지도' })).toBeVisible();

  const cluster = page.getByRole('button', { name: '이 영역의 행사 2개, 확대해서 보기' });
  await expect(cluster).toBeVisible();
  await cluster.click();

  const isMobile = (page.viewportSize()?.width ?? 0) < 768;
  const openListButton = page.getByRole('button', { name: /행사 목록 열기, 현재 영역 2개 행사/ });
  if (isMobile) {
    await expect(openListButton).toBeVisible();
    await openListButton.click();
  }

  await expect(page.getByRole('button', { name: /문화산책 테스트 공연,/ }).first()).toBeVisible();

  if (isMobile) {
    await page.getByRole('button', { name: '목록 접고 지도 보기', exact: true }).click();
  }

  const themeToggle = page.getByRole('button', { name: '다크모드로 전환' });
  await themeToggle.click();
  await expect(page.locator('html')).toHaveClass(/dark/);

  const marker = page.locator('.e2e-kakao-marker[data-title="문화산책 테스트 공연"]');
  await expect(marker).toBeVisible();
  await marker.click();

  const duplicateSheet = page.getByRole('dialog', { name: '행사 상세 정보' });
  await expect(duplicateSheet.getByText('같은 위치에서 여러 행사가 열리고 있습니다.')).toBeVisible();
  await duplicateSheet.getByRole('button', { name: /^문화산책 테스트 공연 2099-/ }).click();

  await expect(page).toHaveURL(url => url.pathname === '/map/101');
  const detailSheet = page.getByRole('dialog', { name: '행사 상세 정보' });
  await expect(detailSheet.getByRole('heading', { name: '문화산책 테스트 공연' })).toBeVisible();
  await expect(detailSheet.getByText('E2E 행사 소개')).toBeVisible();
  await expect(detailSheet.getByText('테스트 프로그램')).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/dark/);

  await page.getByRole('button', { name: '상세 패널 닫기' }).click();
  await expect(page).toHaveURL(url => url.pathname === '/map' && url.searchParams.get('selected') === '101');

  const returnUrl = new URL(page.url());
  expect(returnUrl.searchParams.get('q')).toBe('문화산책');
  expect(returnUrl.searchParams.get('category')).toBe('performance');
  expect(returnUrl.searchParams.get('region')).toBe('서울');
  expect(returnUrl.searchParams.get('free')).toBe('1');
  expect(returnUrl.searchParams.get('list')).toBe('open');
  expect(returnUrl.searchParams.get('focus')).toBe('101');

  const restoredSearch = isMobile ? page.locator('#map-search-input-mobile') : page.locator('#map-search-input');
  await expect(restoredSearch).toHaveValue('문화산책');
  if (isMobile) {
    await expect(page.getByRole('button', { name: '목록 접고 지도 보기', exact: true })).toBeVisible();
  } else {
    await expect(page.getByRole('complementary', { name: '문화행사 탐색 패널' })).toBeVisible();
  }
  await expect(page.locator('html')).toHaveClass(/dark/);
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  );
  expect(hasHorizontalOverflow).toBe(false);
});
