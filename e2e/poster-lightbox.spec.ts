import { expect, gotoApp, test } from './support/test';

test('포스터 확대창은 열릴 때 닫기 버튼으로 키보드 포커스를 이동한다', async ({ page }) => {
  await gotoApp(page, '/cultures/101');

  await page.getByRole('button', { name: '포스터 크게 보기' }).click();
  const dialog = page.getByRole('dialog', { name: '포스터 전체화면 크게 보기' });
  const closeButton = dialog.getByRole('button', { name: '확대 보기 닫기' });
  await expect(dialog).toBeVisible();
  await expect(closeButton).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(closeButton).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(closeButton).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: '포스터 크게 보기' })).toBeFocused();
});
