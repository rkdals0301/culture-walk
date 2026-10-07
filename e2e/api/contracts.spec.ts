import { expect, test } from '@playwright/test';

test('Web Vitals API accepts valid metrics and rejects malformed or oversized bodies', async ({ request }) => {
  const validMetric = { id: 'vitals-e2e-1', name: 'LCP', value: 1_250, delta: 1_250,
    rating: 'good', navigationType: 'navigate', pathname: '/' };
  const accepted = await request.post('/api/vitals', { data: validMetric });
  expect(accepted.status()).toBe(204);
  expect(accepted.headers()['cache-control']).toBe('no-store');
  const malformed = await request.post('/api/vitals', { data: '{', headers: { 'Content-Type': 'application/json' } });
  expect(malformed.status()).toBe(400);
  const oversized = await request.post('/api/vitals', { data: { ...validMetric, extra: 'x'.repeat(3_000) } });
  expect(oversized.status()).toBe(413);
});

test('client error endpoint accepts bounded signals and rejects malformed or oversized bodies', async ({ request }) => {
  const accepted = await request.post('/api/client-errors', {
    data: { source: 'boundary', scope: 'culture-detail', errorType: 'TypeError', pathname: '/cultures/12345' },
  });
  expect(accepted.status()).toBe(204);
  expect(accepted.headers()['cache-control']).toBe('no-store');
  const malformed = await request.post('/api/client-errors', { data: '{', headers: { 'Content-Type': 'application/json' } });
  expect(malformed.status()).toBe(400);
  const oversized = await request.post('/api/client-errors', {
    data: { source: 'boundary', scope: 'app', errorType: 'Error', pathname: `/${'x'.repeat(1_500)}` },
  });
  expect(oversized.status()).toBe(413);
});

test('행사 피드 cursor가 이전 read-model snapshot이면 새 목록 페이지를 거부한다', async ({ request }) => {
  const firstResponse = await request.get('/api/cultures/feed?limit=1');
  expect(firstResponse.ok()).toBe(true);
  const firstPage = (await firstResponse.json()) as { nextCursor: string | null };
  expect(firstPage.nextCursor).not.toBeNull();
  const cursor = JSON.parse(decodeURIComponent(firstPage.nextCursor!)) as Record<string, unknown>;
  cursor.snapshot = 'stale-read-model-snapshot';
  const staleResponse = await request.get('/api/cultures/feed', {
    params: { limit: '1', cursor: encodeURIComponent(JSON.stringify(cursor)) },
  });
  expect(staleResponse.status()).toBe(409);
  await expect(staleResponse.json()).resolves.toMatchObject({ error: expect.stringContaining('목록') });
});
