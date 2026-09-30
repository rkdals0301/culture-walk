import assert from 'node:assert/strict';
import test from 'node:test';

import { isTelemetryRequestRateLimited } from '../src/server/telemetryRateLimit';

test('client telemetry rate limit is shared per client and fails open if its optional binding is unavailable', async () => {
  const keys: string[] = [];
  const rateLimiter = {
    limit: async ({ key }: { key: string }) => {
      keys.push(key);
      return { success: false };
    },
  };

  assert.equal(await isTelemetryRequestRateLimited(rateLimiter, '203.0.113.10'), true);
  assert.equal(await isTelemetryRequestRateLimited(undefined, '203.0.113.10'), false);
  assert.equal(
    await isTelemetryRequestRateLimited({ limit: async () => { throw new Error('unavailable'); } }, 'client'),
    false
  );
  assert.deepEqual(keys, ['203.0.113.10']);
});
