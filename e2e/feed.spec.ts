import { expect, gotoApp, test } from './support/test';

test('피드 필터와 검색 상태가 지도 URL과 화면에 그대로 이어진다', async ({ page }) => {
  await gotoApp(page, '/');

  await expect(page.getByRole('heading', { name: '전국 문화행사 둘러보기' })).toBeVisible();
  await expect(page.getByRole('link', { name: /문화산책 테스트 공연 2099-/ })).toBeVisible();

  await page.getByRole('group', { name: '문화행사 카테고리' }).getByRole('button', { name: '공연', exact: true }).click();
  await page.getByLabel('지역 필터').selectOption('서울');
  await page.getByRole('button', { name: '무료만' }).click();
  await page.getByLabel('문화행사 검색').fill('문화산책');

  await expect(page.getByRole('link', { name: /문화산책 테스트 공연 2099-/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /문화산책 부산 테스트 축제,/ })).toHaveCount(0);

  await page.getByRole('button', { name: '지도에서 보기' }).click();
  await expect(page).toHaveURL(url => url.pathname === '/map');

  const mapUrl = new URL(page.url());
  expect(mapUrl.searchParams.get('q')).toBe('문화산책');
  expect(mapUrl.searchParams.get('category')).toBe('performance');
  expect(mapUrl.searchParams.get('region')).toBe('서울');
  expect(mapUrl.searchParams.get('free')).toBe('1');
  await expect(page.getByRole('region', { name: '전국 문화행사 지도' })).toBeVisible();
});

test('피드 기본 화면은 모바일과 데스크톱에서 가로 overflow 없이 렌더링된다', async ({ page }) => {
  await gotoApp(page, '/');
  await expect(page.getByRole('link', { name: /문화산책 테스트 공연 2099-/ })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test('부분 무료 행사는 전액 무료로 표시하지 않는다', async ({ page }) => {
  await page.route('**/api/cultures/feed**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            id: 901,
            classification: '공연',
            endDate: '2099-10-05T00:00:00.000Z',
            guName: '서울 종로구',
            isFree: '부분 무료',
            lat: 37.5796,
            lng: 126.977,
            mainImage: '/assets/images/logo.svg',
            place: '종로 문화관',
            startDate: '2099-10-01T00:00:00.000Z',
            title: '부분 무료 E2E 행사',
            useFee: '성인 5,000원, 어린이 무료',
          },
        ],
        nextCursor: null,
        hasMore: false,
        totalCount: 1,
        freeCount: 0,
        regionOptions: ['서울'],
      }),
    })
  );

  await gotoApp(page, '/');
  await page.getByLabel('문화행사 검색').fill('부분 무료 E2E');

  const card = page.locator('.feed-card').filter({ hasText: '부분 무료 E2E 행사' });
  await expect(card.getByText('부분 무료', { exact: true })).toBeVisible();
  await expect(card.getByText('무료', { exact: true })).toHaveCount(0);
});
