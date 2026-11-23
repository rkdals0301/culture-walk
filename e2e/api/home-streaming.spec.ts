import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('a slow KV read does not block the first home document bytes or remove server-rendered cards', async ({ baseURL }) => {
  const delayMs = 1500;
  const startedAt = performance.now();
  const response = await fetch(baseURL!, { headers: { 'x-culture-test-kv-delay': String(delayMs) },
    signal: AbortSignal.timeout(15_000) });
  const headersMs = performance.now() - startedAt;
  const body = await response.text();
  const totalMs = performance.now() - startedAt;
  const timingPath = test.info().outputPath('cold-home-timing.json');
  await writeFile(timingPath, JSON.stringify({ delayMs, headersMs, totalMs }));
  await test.info().attach('cold-home-timing', { path: timingPath, contentType: 'application/json' });
  expect(response.status).toBe(200);
  expect(headersMs).toBeLessThan(1000);
  expect(totalMs).toBeGreaterThanOrEqual(delayMs - 100);
  expect(body).toContain('행사 정보를 불러오는 중입니다');
  expect(body).toMatch(/href="\/cultures\/[1-9]\d*"/);
  expect(response.headers.get('server-timing')).toContain('worker-response');
});
