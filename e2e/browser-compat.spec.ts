import { expect, gotoApp, test } from './support/test';

test('핵심 피드 화면이 브라우저 호환 smoke를 통과한다', async ({ page }) => {
  await gotoApp(page, '/');
  await expect(page.getByRole('heading', { name: '전국 문화행사 둘러보기' })).toBeVisible();
  await expect(page.getByRole('link', { name: /문화산책 테스트 공연 2099-/ })).toBeVisible();
});

test('핵심 지도 화면이 브라우저 호환 smoke를 통과한다', async ({ page }) => {
  await gotoApp(page, '/map');
  await expect(page.getByRole('region', { name: '전국 문화행사 지도' })).toBeVisible();
});

test('핵심 상세 화면이 브라우저 호환 smoke를 통과한다', async ({ page }) => {
  await gotoApp(page, '/cultures/101');
  await expect(page.getByRole('heading', { name: '문화산책 테스트 공연' })).toBeVisible();
});
