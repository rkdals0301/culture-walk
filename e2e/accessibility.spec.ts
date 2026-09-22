import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

import { expect, test } from './support/test';

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
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '전국 문화행사 둘러보기' })).toBeVisible();
  await expect(page.getByRole('link', { name: /문화산책 테스트 공연 2099-/ })).toBeVisible();

  await expectNoAccessibilityViolations(page);
});

test('지도 핵심 화면은 WCAG 2.1 A/AA 자동 검사를 통과한다', async ({ page }) => {
  await page.goto('/map');
  await expect(page.getByRole('region', { name: '전국 문화행사 지도' })).toBeVisible();

  await expectNoAccessibilityViolations(page);
});

test('독립 행사 상세 화면은 WCAG 2.1 A/AA 자동 검사를 통과한다', async ({ page }) => {
  await page.goto('/cultures/101');
  await expect(page.getByRole('heading', { name: '문화산책 테스트 공연' })).toBeVisible();

  await expectNoAccessibilityViolations(page);
});
