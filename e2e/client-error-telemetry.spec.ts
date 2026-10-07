import { expect, test } from './support/test';

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
