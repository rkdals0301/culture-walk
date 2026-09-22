import { expect, test } from './support/test';

test('검색 결과가 없을 때 전체 필터 초기화로 기본 목록을 복구한다', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('link', { name: /문화산책 테스트 공연 2099-/ })).toBeVisible();

  await page.getByLabel('문화행사 검색').fill('존재하지않는행사-e2e');
  await expect(page.getByRole('heading', { name: '조건에 맞는 행사가 없습니다' })).toBeVisible();

  await page.getByRole('button', { name: '모든 필터 초기화' }).click();
  await expect(page.getByLabel('문화행사 검색')).toHaveValue('');
  await expect(page.getByRole('link', { name: /문화산책 테스트 공연 2099-/ })).toBeVisible();
});

test('위치 권한 거부 시 사용자에게 안내하고 거리순 상태로 전환하지 않는다', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition(
          _success: PositionCallback,
          error: PositionErrorCallback | null
        ) {
          error?.({ code: 1, message: 'permission denied', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
        },
      },
    });
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '현재 위치를 확인하고 거리순으로 정렬' }).click();

  await expect(page.getByText('위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.')).toBeVisible();
  await expect(page.getByRole('button', { name: '현재 위치를 확인하고 거리순으로 정렬' })).toHaveAttribute(
    'aria-pressed',
    'false'
  );
  await expect(page.getByRole('button', { name: '내 위치' })).toHaveAttribute('aria-pressed', 'false');
});

test('피드 API 응답 오류 후 다시 시도로 정상 상태를 복구한다', async ({ page }) => {
  await page.route(
    '**/api/cultures/feed**',
    async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{ malformed-json',
      });
    },
    { times: 1 }
  );

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('link', { name: /문화산책 테스트 공연 2099-/ })).toBeVisible();

  await page.getByLabel('문화행사 검색').fill('API-복구-e2e');
  await expect(page.getByText('행사 정보를 불러오지 못했습니다')).toBeVisible();
  await page.getByRole('button', { name: '다시 시도' }).click();

  await expect(page.getByRole('heading', { name: '조건에 맞는 행사가 없습니다' })).toBeVisible();
  await expect(page.getByText('행사 정보를 불러오지 못했습니다')).toHaveCount(0);
});

test('테마 선택은 새로고침 뒤에도 유지된다', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const darkModeButton = page.getByRole('button', { name: '다크모드로 전환' });
  await expect(darkModeButton).toBeVisible();
  await darkModeButton.click();
  await expect(page.locator('html')).toHaveClass(/dark/);

  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.getByRole('button', { name: '라이트모드로 전환' })).toBeVisible();
});
