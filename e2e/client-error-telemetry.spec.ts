import { expect, test } from './support/test';

const APP_ORIGIN = 'http://127.0.0.1:3005';

test('client error endpoint accepts bounded signals and rejects malformed or oversized bodies', async ({ page }) => {
  const accepted = await page.request.post(`${APP_ORIGIN}/api/client-errors`, {
    data: {
      source: 'boundary',
      scope: 'culture-detail',
      errorType: 'TypeError',
      pathname: '/cultures/12345',
    },
  });
  expect(accepted.status()).toBe(204);
  expect(accepted.headers()['cache-control']).toBe('no-store');

  const malformed = await page.request.post(`${APP_ORIGIN}/api/client-errors`, {
    data: '{',
    headers: { 'Content-Type': 'application/json' },
  });
  expect(malformed.status()).toBe(400);

  const oversized = await page.request.post(`${APP_ORIGIN}/api/client-errors`, {
    data: JSON.stringify({
      source: 'boundary',
      scope: 'app',
      errorType: 'Error',
      pathname: `/${'x'.repeat(1_500)}`,
    }),
    headers: { 'Content-Type': 'application/json' },
  });
  expect(oversized.status()).toBe(413);
});

test('pre-hydration window errors are sent as sanitized same-origin telemetry', async ({ page }) => {
  await page.goto('/');

  const telemetryRequest = page.waitForRequest(request =>
    new URL(request.url()).pathname.endsWith('/api/client-errors')
  );
  await page.evaluate(() => {
    window.dispatchEvent(
      new ErrorEvent('error', {
        error: new TypeError('private message must not be sent'),
        message: 'private message must not be sent',
      })
    );
  });

  const request = await telemetryRequest;
  expect(request.postDataJSON()).toEqual({
    source: 'window_error',
    scope: 'global',
    errorType: 'TypeError',
    pathname: '/',
  });
  expect((await request.response())?.status()).toBe(204);
});
