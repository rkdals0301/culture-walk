import { expect, test } from '@playwright/test';

const gotoHydrated = async (page: import('@playwright/test').Page, path: string) => {
  const response = await page.goto(path, { waitUntil: 'commit' });
  expect(response?.ok()).toBe(true);
  await expect(page.locator('html')).toHaveAttribute('data-app-hydrated', 'true', { timeout: 15_000 });
};

test('운영 WebKit에서 피드와 상세 탐색이 동작한다', async ({ page }) => {
  await gotoHydrated(page, '/');
  await expect(page.getByRole('heading', { name: '전국 문화행사 둘러보기' })).toBeVisible();

  const firstCulture = page.locator('a[href^="/cultures/"]').first();
  await expect(firstCulture).toBeVisible();
  const href = await firstCulture.getAttribute('href');
  expect(href).toMatch(/^\/cultures\/\d+/);

  await gotoHydrated(page, href!);
  await expect(page.locator('main h1').first()).toBeVisible();
});

test('운영 WebKit에서 지도 핵심 화면이 동작한다', async ({ page }) => {
  await gotoHydrated(page, '/map');
  await expect(page.getByRole('region', { name: '전국 문화행사 지도' })).toBeVisible();
});
