import { expect, test } from '@playwright/test';
import { gotoApp } from './support/test';

test('Pretendard loads required self-hosted subsets and fetches uncommon Hangul on demand', async ({ page }) => {
  const fontRequests: string[] = [];
  page.on('request', request => {
    if (request.url().includes('/assets/fonts/pretendard-1.3.9/')) fontRequests.push(request.url());
  });

  await gotoApp(page, '/about');
  await expect.poll(() => fontRequests.some(url => url.endsWith('PretendardVariable.subset.91.woff2'))).toBe(true);
  expect(fontRequests.length).toBeLessThan(20);
  expect(fontRequests.some(url => url.endsWith('/PretendardVariable.woff2'))).toBe(false);

  const uncommonGlyphRequest = page.waitForRequest(request =>
    request.url().endsWith('PretendardVariable.subset.1.woff2')
  );
  await page.evaluate(async () => {
    await document.fonts.load('400 16px "Pretendard Variable"', '힣');
    await document.fonts.ready;
  });
  await uncommonGlyphRequest;

  expect(fontRequests.some(url => url.endsWith('PretendardVariable.subset.1.woff2'))).toBe(true);
});
