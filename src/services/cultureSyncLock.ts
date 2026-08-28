import { getWorkerEnv } from '@/server/cloudflare';

import {
  D1Binding,
  INITIALIZE_LOCK_LEASE_LOST_MESSAGE,
  INITIALIZE_LOCK_NAME,
  INITIALIZE_LOCK_TABLE,
  INITIALIZE_LOCK_TTL_MINUTES,
  WorkerEnv,
} from './cultureSyncTypes';

export const getD1Binding = (env: WorkerEnv) => {
  if (!env.DB) {
    return null;
  }

  return env.DB as D1Binding;
};

const ensureInitializeLockTable = async (d1: D1Binding) => {
  await d1
    .prepare(
      `CREATE TABLE IF NOT EXISTS ${INITIALIZE_LOCK_TABLE} (
        name TEXT PRIMARY KEY,
        owner_token TEXT NOT NULL,
        acquired_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at TEXT NOT NULL
      )`
    )
    .run();
};

export const acquireInitializeLock = async (env: Awaited<ReturnType<typeof getWorkerEnv>>) => {
  const d1 = getD1Binding(env);
  if (!d1) {
    return crypto.randomUUID();
  }

  await ensureInitializeLockTable(d1);
  const ownerToken = crypto.randomUUID();

  await d1
    .prepare(
      `DELETE FROM ${INITIALIZE_LOCK_TABLE}
       WHERE name = ?
         AND datetime(expires_at) <= datetime('now')`
    )
    .bind(INITIALIZE_LOCK_NAME)
    .run();

  const result = await d1
    .prepare(
      `INSERT INTO ${INITIALIZE_LOCK_TABLE} (name, owner_token, acquired_at, expires_at)
       VALUES (?, ?, CURRENT_TIMESTAMP, datetime('now', '+${INITIALIZE_LOCK_TTL_MINUTES} minutes'))
       ON CONFLICT(name) DO NOTHING
       RETURNING owner_token`
    )
    .bind(INITIALIZE_LOCK_NAME, ownerToken)
    .all();

  return result.results?.[0]?.owner_token === ownerToken ? ownerToken : null;
};

export const releaseInitializeLock = async (
  env: Awaited<ReturnType<typeof getWorkerEnv>>,
  ownerToken: string
) => {
  const d1 = getD1Binding(env);
  if (!d1) {
    return;
  }

  await d1
    .prepare(`DELETE FROM ${INITIALIZE_LOCK_TABLE} WHERE name = ? AND owner_token = ?`)
    .bind(INITIALIZE_LOCK_NAME, ownerToken)
    .run();
};

export const renewInitializeLock = async (
  env: Awaited<ReturnType<typeof getWorkerEnv>>,
  ownerToken: string
) => {
  const d1 = getD1Binding(env);
  if (!d1) return true;

  const result = await d1
    .prepare(
      `UPDATE ${INITIALIZE_LOCK_TABLE}
       SET expires_at = datetime('now', '+${INITIALIZE_LOCK_TTL_MINUTES} minutes'),
           acquired_at = CURRENT_TIMESTAMP
       WHERE name = ?
         AND owner_token = ?
         AND datetime(expires_at) >= datetime('now')
       RETURNING owner_token`
    )
    .bind(INITIALIZE_LOCK_NAME, ownerToken)
    .all();

  return result.results?.[0]?.owner_token === ownerToken;
};

const LOCK_HEARTBEAT_INTERVAL_MS = Math.max(
  1_000,
  Math.floor((INITIALIZE_LOCK_TTL_MINUTES * 60 * 1000) / 3)
);

export const startInitializeLockHeartbeat = (
  env: Awaited<ReturnType<typeof getWorkerEnv>>,
  ownerToken: string,
  intervalMs = LOCK_HEARTBEAT_INTERVAL_MS
) => {
  let leaseLost = false;
  let renewal: Promise<boolean> | null = null;

  const renew = async () => {
    if (leaseLost) return false;
    if (renewal) return renewal;

    renewal = renewInitializeLock(env, ownerToken)
      .then(renewed => {
        if (!renewed) leaseLost = true;
        return renewed;
      })
      .catch(error => {
        leaseLost = true;
        console.error('동기화 락 갱신 실패:', error);
        return false;
      })
      .finally(() => {
        renewal = null;
      });

    return renewal;
  };

  const ensureHeld = async () => {
    if (!(await renew())) {
      throw new Error(INITIALIZE_LOCK_LEASE_LOST_MESSAGE);
    }
  };

  const timer = setInterval(() => {
    void renew();
  }, Math.max(1, intervalMs));

  return {
    renew,
    ensureHeld,
    stop: async () => {
      clearInterval(timer);
      if (renewal) await renewal;
    },
  };
};
