import {
  acquireInitializeLock,
  releaseInitializeLock,
  runWithInitializeLock,
  startInitializeLockHeartbeat,
} from '@/services/cultureSyncLock';
import { D1Binding, D1Statement, INITIALIZE_LOCK_LEASE_LOST_MESSAGE } from '@/services/cultureSyncTypes';

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

test('lock heartbeat renews the lease periodically', async () => {
  let renewalCount = 0;
  let resolveRenewal: (() => void) | undefined;
  const renewalObserved = new Promise<void>(resolve => {
    resolveRenewal = resolve;
  });

  const createStatement = (query: string, values: unknown[] = []): D1Statement => ({
    bind: (...nextValues) => createStatement(query, nextValues),
    run: async () => ({}),
    all: async () => {
      if (query.includes('UPDATE initialize_sync_locks')) {
        renewalCount += 1;
        resolveRenewal?.();
        return { results: [{ owner_token: values[1] }] };
      }

      return { results: [] };
    },
  });

  const d1: D1Binding = {
    prepare: query => createStatement(query),
    batch: async statements => statements.map(() => ({})),
  };
  const env = { DB: d1 } as never;
  const heartbeat = startInitializeLockHeartbeat(env, 'owner-token', 1);

  try {
    await Promise.race([
      renewalObserved,
      new Promise<void>((_, reject) => setTimeout(() => reject(new Error('heartbeat did not renew')), 100)),
    ]);
  } finally {
    await heartbeat.stop();
  }

  assert.ok(renewalCount >= 1);
});

test('initialize lock helper does not run the task when the lock is busy', async () => {
  let taskRuns = 0;
  const createStatement = (query: string, values: unknown[] = []): D1Statement => ({
    bind: (...nextValues) => createStatement(query, nextValues),
    run: async () => ({}),
    all: async () => ({
      results: query.includes('INSERT INTO initialize_sync_locks') ? [] : [{ owner_token: values[1] }],
    }),
  });
  const d1: D1Binding = {
    prepare: query => createStatement(query),
    batch: async statements => statements.map(() => ({})),
  };

  const result = await runWithInitializeLock({ DB: d1 } as never, async () => {
    taskRuns += 1;
    return 'unexpected';
  });

  assert.deepEqual(result, { acquired: false, value: null });
  assert.equal(taskRuns, 0);
});

test('initialize lock helper releases the lock after a successful task', async () => {
  let releaseCount = 0;
  let renewalCount = 0;
  const createStatement = (query: string, values: unknown[] = []): D1Statement => ({
    bind: (...nextValues) => createStatement(query, nextValues),
    run: async () => {
      if (query.includes('DELETE FROM initialize_sync_locks WHERE name = ? AND owner_token = ?')) {
        releaseCount += 1;
      }
      return {};
    },
    all: async () => {
      if (query.includes('INSERT INTO initialize_sync_locks')) return { results: [{ owner_token: values[1] }] };
      if (query.includes('UPDATE initialize_sync_locks')) {
        renewalCount += 1;
        return { results: [{ owner_token: values[1] }] };
      }
      return { results: [] };
    },
  });
  const d1: D1Binding = {
    prepare: query => createStatement(query),
    batch: async statements => statements.map(() => ({})),
  };

  const result = await runWithInitializeLock({ DB: d1 } as never, async lease => {
    await lease.ensureHeld();
    return 'ok';
  });

  assert.deepEqual(result, { acquired: true, value: 'ok' });
  assert.ok(renewalCount >= 1);
  assert.equal(releaseCount, 1);
});

test('initialize lock helper releases the lock when the task fails', async () => {
  let releaseCount = 0;
  const createStatement = (query: string, values: unknown[] = []): D1Statement => ({
    bind: (...nextValues) => createStatement(query, nextValues),
    run: async () => {
      if (query.includes('DELETE FROM initialize_sync_locks WHERE name = ? AND owner_token = ?')) {
        releaseCount += 1;
      }
      return {};
    },
    all: async () => ({
      results:
        query.includes('INSERT INTO initialize_sync_locks') || query.includes('UPDATE initialize_sync_locks')
          ? [{ owner_token: values[1] }]
          : [],
    }),
  });
  const d1: D1Binding = {
    prepare: query => createStatement(query),
    batch: async statements => statements.map(() => ({})),
  };

  await assert.rejects(
    runWithInitializeLock({ DB: d1 } as never, async () => {
      throw new Error('sync failed');
    }),
    /sync failed/
  );
  assert.equal(releaseCount, 1);
});

test('initialize lock helper releases the lock when the lease is lost before the task starts', async () => {
  let releaseCount = 0;
  let taskRuns = 0;
  const createStatement = (query: string, values: unknown[] = []): D1Statement => ({
    bind: (...nextValues) => createStatement(query, nextValues),
    run: async () => {
      if (query.includes('DELETE FROM initialize_sync_locks WHERE name = ? AND owner_token = ?')) {
        releaseCount += 1;
      }
      return {};
    },
    all: async () => {
      if (query.includes('INSERT INTO initialize_sync_locks')) return { results: [{ owner_token: values[1] }] };
      if (query.includes('UPDATE initialize_sync_locks')) return { results: [] };
      return { results: [] };
    },
  });
  const d1: D1Binding = {
    prepare: query => createStatement(query),
    batch: async statements => statements.map(() => ({})),
  };

  await assert.rejects(
    runWithInitializeLock({ DB: d1 } as never, async () => {
      taskRuns += 1;
      return 'unexpected';
    }),
    error => error instanceof Error && error.message === INITIALIZE_LOCK_LEASE_LOST_MESSAGE
  );

  assert.equal(taskRuns, 0);
  assert.equal(releaseCount, 1);
});
