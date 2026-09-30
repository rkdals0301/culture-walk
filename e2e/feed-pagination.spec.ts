import { expect, gotoApp, test } from './support/test';

const APP_ORIGIN = 'http://127.0.0.1:3005';

test('행사 피드 cursor가 이전 read-model snapshot이면 새 목록 페이지를 거부한다', async ({ page }) => {
  const firstResponse = await page.request.get(`${APP_ORIGIN}/api/cultures/feed?limit=1`);
  expect(firstResponse.ok()).toBe(true);

  const firstPage = (await firstResponse.json()) as { nextCursor: string | null };
  expect(firstPage.nextCursor).not.toBeNull();

  const cursor = JSON.parse(decodeURIComponent(firstPage.nextCursor!)) as Record<string, unknown>;
  cursor.snapshot = 'stale-read-model-snapshot';
  const url = new URL('/api/cultures/feed', APP_ORIGIN);
  url.searchParams.set('limit', '1');
  url.searchParams.set('cursor', encodeURIComponent(JSON.stringify(cursor)));

  const staleResponse = await page.request.get(url.toString());
  expect(staleResponse.status()).toBe(409);
  await expect(staleResponse.json()).resolves.toMatchObject({
    error: expect.stringContaining('목록'),
  });
});

test('stale cursor 응답을 받으면 피드는 최신 첫 페이지로 교체해 이어서 보여준다', async ({ page }) => {
  let firstPageRequests = 0;

  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const requestUrl = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const url = new URL(requestUrl, window.location.origin);
      if (url.pathname === '/api/cultures/feed' && url.searchParams.get('q') === 'snapshot-restart' && url.searchParams.has('cursor')) {
        (window as Window & { __staleFeedCursorWasRetried?: boolean }).__staleFeedCursorWasRetried = true;
        return new Response(JSON.stringify({ error: '문화 목록이 업데이트되어 처음부터 다시 불러옵니다.' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return originalFetch(input, init);
    };
  });

  await page.route('**/api/cultures/feed**', async route => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('q') !== 'snapshot-restart') return route.continue();

    firstPageRequests += 1;
    const isRetry = firstPageRequests > 1;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            id: isRetry ? 903 : 902,
            classification: '공연',
            endDate: '2099-10-05T00:00:00.000Z',
            guName: '서울 종로구',
            isFree: '무료',
            lat: 37.5796,
            lng: 126.977,
            mainImage: '/assets/images/logo.svg',
            place: '종로 문화관',
            startDate: '2099-10-01T00:00:00.000Z',
            title: isRetry ? '최신 snapshot 행사' : '이전 snapshot 행사',
            useFee: '무료',
          },
        ],
        nextCursor: isRetry ? null : 'stale-cursor-token',
        hasMore: !isRetry,
        totalCount: 1,
        freeCount: 1,
        regionOptions: ['서울'],
      }),
    });
  });

  await gotoApp(page, '/');
  await page.getByLabel('문화행사 검색').fill('snapshot-restart');

  const previousCard = page.locator('.feed-card').filter({ hasText: '이전 snapshot 행사' });
  await expect(page.locator('.feed-card').filter({ hasText: '최신 snapshot 행사' })).toBeVisible();
  await expect(previousCard).toHaveCount(0);
  expect(
    await page.evaluate(
      () => (window as Window & { __staleFeedCursorWasRetried?: boolean }).__staleFeedCursorWasRetried === true
    )
  ).toBe(true);
  expect(firstPageRequests).toBe(2);
});
