import { acquireInitializeLock, releaseInitializeLock } from '@/services/cultureSyncLock';
import { D1Binding, D1Statement } from '@/services/cultureSyncTypes';

import assert from 'node:assert/strict';
import test from 'node:test';

test('only the lock owner can release an initialize lock', async () => {
  const calls: Array<{ query: string; values: unknown[] }> = [];

  const createStatement = (query: string, values: unknown[] = []): D1Statement => ({
    bind: (...nextValues) => {
      calls.push({ query, values: nextValues });
      return createStatement(query, nextValues);
    },
    run: async () => ({}),
    all: async () => ({
      results: query.includes('RETURNING owner_token') ? [{ owner_token: values[1] }] : [],
    }),
  });

  const d1: D1Binding = {
    prepare: query => createStatement(query),
    batch: async statements => statements.map(() => ({})),
  };
  const env = { DB: d1 } as never;

  const ownerToken = await acquireInitializeLock(env);
  assert.equal(typeof ownerToken, 'string');
  assert.ok(ownerToken);

  await releaseInitializeLock(env, ownerToken);

  const acquireCall = calls.find(call => call.query.includes('INSERT INTO initialize_sync_locks'));
  const releaseCall = calls.find(call => call.query.includes('AND owner_token = ?'));

  assert.equal(acquireCall?.values[1], ownerToken);
  assert.deepEqual(releaseCall?.values, ['initialize-sync-lock', ownerToken]);
});
