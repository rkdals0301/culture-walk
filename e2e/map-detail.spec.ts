import { expect, gotoApp, test } from './support/test';

const FILTERED_MAP_URL = '/map?q=문화산책&category=performance&region=서울&free=1';

test('실제로 존재하지 않는 행사만 404 상세 상태로 보낸다', async ({ page }) => {
  const missingCulturePage = await page.context().newPage();
  try {
    const apiResponse = await missingCulturePage.request.get('/api/cultures/999999999');
    expect(apiResponse.status()).toBe(404);

    const pageResponse = await missingCulturePage.goto('/cultures/999999999', { waitUntil: 'commit' });
    expect(pageResponse?.status()).toBe(404);
    await expect(missingCulturePage.getByRole('heading', { name: '페이지를 찾을 수 없습니다.' })).toBeVisible();
  } finally {
    await missingCulturePage.close();
  }
});

test('문화 상세에서 지도 이동 시 URL의 행사 좌표와 확대 단계를 적용한다', async ({ page }) => {
  await gotoApp(page, '/cultures/101');

  await page
    .getByRole('link', { name: /문화지도에서 위치 확인|지도에서 위치 보기/ })
    .click();

  await expect(page).toHaveURL(url => url.pathname === '/map' && url.searchParams.get('focus') === '101');
  const mapCanvas = page.getByRole('region', { name: '전국 문화행사 지도' });
  await expect(mapCanvas).toHaveAttribute('data-e2e-map-lat', '37.5796');
  await expect(mapCanvas).toHaveAttribute('data-e2e-map-lng', '126.977');
  await expect(mapCanvas).toHaveAttribute('data-e2e-map-level', '4');

  const isMobile = (page.viewportSize()?.width ?? 0) < 768;
  if (isMobile) {
    await expect(page.getByRole('button', { name: '목록 접고 지도 보기', exact: true })).toBeVisible();
  } else {
    await expect(page.getByRole('complementary', { name: '문화행사 탐색 패널' })).toBeVisible();
  }
});

test('지도 cluster부터 상세 확인과 목록 복귀까지 탐색 상태를 보존한다', async ({ page }) => {
  await gotoApp(page, FILTERED_MAP_URL);
  await expect(page.getByRole('region', { name: '전국 문화행사 지도' })).toBeVisible();

  const cluster = page.getByRole('button', { name: '이 영역의 행사 2개, 확대해서 보기' });
  await expect(cluster).toBeVisible();
  await cluster.click();
  const mapCanvas = page.getByRole('region', { name: '전국 문화행사 지도' });
  await expect(mapCanvas).toHaveAttribute('data-e2e-map-level', '9');
  await expect(mapCanvas).toHaveAttribute('data-e2e-map-lat', '37.5796');
  await expect(mapCanvas).toHaveAttribute('data-e2e-map-lng', '126.977');

  const isMobile = (page.viewportSize()?.width ?? 0) < 768;
  const openListButton = page.getByRole('button', { name: /현재 영역 2개 보기/ });
  if (isMobile) {
    await expect(openListButton).toBeVisible();
    await openListButton.click();
  } else {
    const expandListButton = page.getByRole('button', { name: /^목록 \d+$/ });
    await expect(expandListButton).toBeVisible();
    await expandListButton.click();
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
  const detailUrl = new URL(page.url());
  expect(detailUrl.searchParams.get('lat')).toBe('37.5796');
  expect(detailUrl.searchParams.get('lng')).toBe('126.977');
  expect(detailUrl.searchParams.get('level')).toBe('9');
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
  expect(returnUrl.searchParams.get('lat')).toBe('37.5796');
  expect(returnUrl.searchParams.get('lng')).toBe('126.977');
  expect(returnUrl.searchParams.get('level')).toBe('9');

  const restoredSearch = isMobile ? page.locator('#map-search-input-mobile') : page.locator('#map-search-input');
  await expect(restoredSearch).toHaveValue('문화산책');
  await expect(mapCanvas).toHaveAttribute('data-e2e-map-level', '9');
  await expect(mapCanvas).toHaveAttribute('data-e2e-map-lat', '37.5796');
  await expect(mapCanvas).toHaveAttribute('data-e2e-map-lng', '126.977');
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
