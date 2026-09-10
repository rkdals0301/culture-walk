import { expect, test } from './support/test';

test('피드 필터와 검색 상태가 지도 URL과 화면에 그대로 이어진다', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: '전국 문화행사 둘러보기' })).toBeVisible();
  await expect(page.getByRole('button', { name: /문화산책 테스트 공연,/ })).toBeVisible();

  await page.getByRole('tab', { name: '공연' }).click();
  await page.getByLabel('지역 필터').selectOption('서울');
  await page.getByRole('button', { name: '무료만' }).click();
  await page.getByLabel('문화행사 검색').fill('문화산책');

  await expect(page.getByRole('button', { name: /문화산책 테스트 공연,/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /문화산책 부산 테스트 축제,/ })).toHaveCount(0);

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
  await page.goto('/');
  await expect(page.getByRole('button', { name: /문화산책 테스트 공연,/ })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  );
  expect(hasHorizontalOverflow).toBe(false);
});
