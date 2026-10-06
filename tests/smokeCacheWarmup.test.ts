import assert from 'node:assert/strict';
import test from 'node:test';
import { requestUntilCacheHit } from '../scripts/smoke-cache-warmup.mjs';

test('cache warmup stops at the first HIT after delayed cache publication', async () => {
  const statuses = ['MISS', 'MISS', 'HIT', 'HIT'];
  const labels: string[] = [];
  const waits: number[] = [];
  const attempts = await requestUntilCacheHit(async (label: string) => {
    labels.push(label);
    return { result: { ok: true, cacheStatus: statuses.shift() } };
  }, 'detail', '/api/cultures/101', { wait: async (ms: number) => { waits.push(ms); } });
  assert.equal(attempts.length, 3);
  assert.deepEqual(labels, ['detail-1', 'detail-2', 'detail-3']);
  assert.deepEqual(waits, [100, 200]);
});

test('a warm cache needs one request, while a persistent MISS remains bounded', async () => {
  const warm = await requestUntilCacheHit(async () => ({ result: { ok: true, cacheStatus: 'HIT' } }), 'feed', '/feed');
  assert.equal(warm.length, 1);
  const cold = await requestUntilCacheHit(async () => ({ result: { ok: true, cacheStatus: 'MISS' } }), 'feed', '/feed', {
    wait: async () => {},
  });
  assert.equal(cold.length, 5);
  assert.ok(cold.every(attempt => attempt?.result.cacheStatus === 'MISS'));
});

test('HTTP errors and request failures stop warmup instead of being hidden by a later HIT', async () => {
  for (const failed of [null, { result: { ok: false, cacheStatus: 'MISS' } }]) {
    let calls = 0;
    const attempts = await requestUntilCacheHit(async () => { calls += 1; return failed; }, 'feed', '/feed');
    assert.equal(calls, 1);
    assert.deepEqual(attempts, [failed]);
  }
});
