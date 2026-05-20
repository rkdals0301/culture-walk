import { getWorkerEnv } from '@/server/cloudflare';

import {
  D1Binding,
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
        acquired_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at TEXT NOT NULL
      )`
    )
    .run();
};

export const acquireInitializeLock = async (env: Awaited<ReturnType<typeof getWorkerEnv>>) => {
  const d1 = getD1Binding(env);
  if (!d1) {
    return true;
  }

  await ensureInitializeLockTable(d1);

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
      `INSERT INTO ${INITIALIZE_LOCK_TABLE} (name, acquired_at, expires_at)
       VALUES (?, CURRENT_TIMESTAMP, datetime('now', '+${INITIALIZE_LOCK_TTL_MINUTES} minutes'))
       ON CONFLICT(name) DO NOTHING
       RETURNING name`
    )
    .bind(INITIALIZE_LOCK_NAME)
    .all();

  return (result.results?.length ?? 0) > 0;
};

export const forceResetInitializeLock = async (env: Awaited<ReturnType<typeof getWorkerEnv>>) => {
  const d1 = getD1Binding(env);
  if (!d1) {
    return;
  }

  await ensureInitializeLockTable(d1);
  await d1.prepare(`DELETE FROM ${INITIALIZE_LOCK_TABLE} WHERE name = ?`).bind(INITIALIZE_LOCK_NAME).run();
};

export const releaseInitializeLock = async (env: Awaited<ReturnType<typeof getWorkerEnv>>) => {
  const d1 = getD1Binding(env);
  if (!d1) {
    return;
  }

  await d1.prepare(`DELETE FROM ${INITIALIZE_LOCK_TABLE} WHERE name = ?`).bind(INITIALIZE_LOCK_NAME).run();
};
