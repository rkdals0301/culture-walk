import { expect, test } from '@playwright/test';

test('Kakao Maps SDK 네트워크 실패 시 오류 안내와 목록 복귀 경로를 제공한다', async ({ page }) => {
  await page.route('https://dapi.kakao.com/**', route => route.abort('failed'));

  await page.goto('/map');

  const mapError = page.locator('[role="alert"][data-status="map-error"]');
  await expect(mapError).toContainText('지도를 불러오지 못했습니다.');
  await expect(mapError).toContainText('Kakao Maps SDK 네트워크 요청에 실패했습니다.');
  await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible();

  await page.getByRole('button', { name: '목록으로 계속 보기' }).click();
  await expect(page).toHaveURL(/\/map\?list=open$/);
  await expect(page.locator('input[aria-label="문화행사 검색"]:visible').first()).toBeVisible();
});
