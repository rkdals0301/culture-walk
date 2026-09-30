import { expect, test } from './support/test';

const APP_ORIGIN = 'http://127.0.0.1:3005';

const validMetric = {
  id: 'vitals-e2e-1',
  name: 'LCP',
  value: 1_250,
  delta: 1_250,
  rating: 'good',
  navigationType: 'navigate',
  pathname: '/',
};

test('Web Vitals API accepts valid metrics and rejects malformed or oversized bodies', async ({ page }) => {
  const accepted = await page.request.post(`${APP_ORIGIN}/api/vitals`, {
    data: JSON.stringify(validMetric),
    headers: { 'Content-Type': 'application/json' },
  });
  expect(accepted.status()).toBe(204);
  expect(accepted.headers()['cache-control']).toBe('no-store');

  const malformed = await page.request.post(`${APP_ORIGIN}/api/vitals`, {
    data: '{',
    headers: { 'Content-Type': 'application/json' },
  });
  expect(malformed.status()).toBe(400);

  const oversized = await page.request.post(`${APP_ORIGIN}/api/vitals`, {
    data: JSON.stringify({ ...validMetric, extra: 'x'.repeat(3_000) }),
    headers: { 'Content-Type': 'application/json' },
  });
  expect(oversized.status()).toBe(413);
});
