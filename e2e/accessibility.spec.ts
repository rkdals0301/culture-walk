import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

import { expect, gotoApp, test } from './support/test';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const expectNoAccessibilityViolations = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const message = results.violations
    .map(
      violation =>
        violation.id +
        ': ' +
        violation.help +
        '\n' +
        violation.nodes
          .map(node => '  ' + node.target.join(' ') + ': ' + node.failureSummary)
          .join('\n')
    )
    .join('\n\n');

  expect(results.violations, message).toEqual([]);
};

test('피드 핵심 화면은 WCAG 2.1 A/AA 자동 검사를 통과한다', async ({ page }) => {
  await gotoApp(page, '/');
  await expect(page.getByRole('heading', { name: '전국 문화행사 둘러보기' })).toBeVisible();
  await expect(page.getByRole('link', { name: /문화산책 테스트 공연 2099-/ })).toBeVisible();

  await expectNoAccessibilityViolations(page);
});

test('지도 핵심 화면은 WCAG 2.1 A/AA 자동 검사를 통과한다', async ({ page }) => {
  await gotoApp(page, '/map');
  await expect(page.getByRole('region', { name: '전국 문화행사 지도' })).toBeVisible();

  await expectNoAccessibilityViolations(page);
});

test('독립 행사 상세 화면은 WCAG 2.1 A/AA 자동 검사를 통과한다', async ({ page }) => {
  await gotoApp(page, '/cultures/101');
  await expect(page.getByRole('heading', { name: '문화산책 테스트 공연' })).toBeVisible();

  await expectNoAccessibilityViolations(page);
});

test('독립 행사 상세 화면은 문서 안에 main 랜드마크를 하나만 둔다', async ({ page }) => {
  await gotoApp(page, '/cultures/101');
  await expect(page.locator('main')).toHaveCount(1);
});

test('404 화면은 홈 이동을 중첩 인터랙티브 요소 없는 링크로 제공한다', async ({ page }) => {
  const notFoundPage = await page.context().newPage();
  try {
    for (const route of ['/cultures/999999999', '/map/999999999']) {
      await notFoundPage.goto(route, { waitUntil: 'commit' });
      const homeLink = notFoundPage.getByRole('link', { name: '홈으로' });
      await expect(homeLink).toHaveAttribute('href', '/');
      await expect(homeLink.locator('button')).toHaveCount(0);
    }
  } finally {
    await notFoundPage.close();
  }
});
