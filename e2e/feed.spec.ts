import { type Page, expect, test } from '@playwright/test';

const sampleCulture = {
  id: 101,
  classification: '공연',
  endDate: '2026-12-31T00:00:00.000Z',
  guName: '서울 종로구',
  isFree: '무료',
  lat: 37.5796,
  lng: 126.977,
  mainImage: '',
  place: '문화산책 테스트홀',
  startDate: '2026-09-01T00:00:00.000Z',
  title: '문화산책 테스트 공연',
  useFee: '무료',
};

const mockFeedApi = async (page: Page) => {
  await page.route('**/api/cultures/feed**', async route => {
    const requestUrl = new URL(route.request().url());
    const query = requestUrl.searchParams.get('q')?.trim() ?? '';
    const items = query && !sampleCulture.title.includes(query) ? [] : [sampleCulture];

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items,
        nextCursor: null,
        hasMore: false,
        totalCount: items.length,
        freeCount: items.length,
        regionOptions: ['서울', '부산'],
      }),
    });
  });
};

test.beforeEach(async ({ page }) => {
  await mockFeedApi(page);
});

test('피드 검색과 필터 상태가 지도 URL에 보존된다', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: '전국 문화행사 둘러보기' })).toBeVisible();
  await expect(page.getByRole('button', { name: /문화산책 테스트 공연/ })).toBeVisible();

  await page.getByRole('tab', { name: '공연' }).click();
  await page.getByLabel('지역 필터').selectOption('서울');
  await page.getByRole('button', { name: '무료만' }).click();
  await page.getByLabel('문화행사 검색').fill('문화산책');

  await expect.poll(() => new URL(page.url()).pathname).toBe('/');
  await page.getByRole('button', { name: '지도에서 보기' }).click();
  await page.waitForURL(url => url.pathname === '/map');

  const url = new URL(page.url());
  expect(url.searchParams.get('q')).toBe('문화산책');
  expect(url.searchParams.get('category')).toBe('performance');
  expect(url.searchParams.get('region')).toBe('서울');
  expect(url.searchParams.get('free')).toBe('1');
});

test('피드 기본 화면은 가로 스크롤 없이 렌더링된다', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('button', { name: /문화산책 테스트 공연/ })).toBeVisible();
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  );

  expect(hasHorizontalOverflow).toBe(false);
});
