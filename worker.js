import openNextWorker, { BucketCachePurge, DOQueueHandler, DOShardedTagCache } from './.open-next/worker.js';
import { hasD1DailyRowReadLimitError, hasD1DailyRowWriteLimitError } from './src/server/sqliteError';
import { hasStaleCachedTourApiDetails, refreshStaleCachedTourApiDetails } from './src/services/cultureSyncDetails';
import {
  acquireInitializeLock,
  getD1Binding,
  releaseInitializeLock,
  startInitializeLockHeartbeat,
} from './src/services/cultureSyncLock';
import {
  getCultureScheduledJob,
  RECOVERY_SYNC_UTC_HOUR,
  shouldRunScheduledSync,
} from './src/services/cultureSyncSchedule';
import { syncCultures } from './src/services/cultureSyncService';
import { TOUR_API_BASE_URL } from './src/services/cultureSyncTypes';

async function runScheduledSync(env, ctx, trigger) {
  console.info(`[cron] snapshot check started trigger=${trigger}`);
  const healthResponse = await openNextWorker.fetch(new Request('https://internal.culturewalk/api/health'), env, ctx);

  if (healthResponse.ok) {
    const health = await healthResponse.json();
    if (!shouldRunScheduledSync(health)) {
      console.info(`[cron] snapshot skipped trigger=${trigger} reason=fresh-sync`);
      return;
    }
  }

  if (!env.DB) {
    throw new Error('DB binding is required for scheduled synchronization');
  }

  if (!env.TOUR_API_KEY) {
    throw new Error('TOUR_API_KEY is required for scheduled synchronization');
  }

  const lockOwner = await acquireInitializeLock(env);
  if (!lockOwner) {
    console.warn(`[cron] snapshot skipped trigger=${trigger} reason=lock-busy`);
    return;
  }

  const heartbeat = startInitializeLockHeartbeat(env, lockOwner);
  try {
    await heartbeat.ensureHeld();
    const result = await syncCultures({ baseUrl: env.TOUR_API_BASE_URL || TOUR_API_BASE_URL, serviceKey: env.TOUR_API_KEY }, env.DB, {
      trigger,
      beforeEach: () => heartbeat.renew(),
      beforeApply: heartbeat.ensureHeld,
    });
    console.info(
      `[cron] snapshot completed trigger=${trigger} fetched=${result.fetched} inserted=${result.inserted} updated=${result.updated}`
    );
  } finally {
    await heartbeat.stop();
    await releaseInitializeLock(env, lockOwner);
  }
}

async function runScheduledDetailRefresh(env) {
  if (!env.DB || !env.TOUR_API_KEY) return;
  const d1 = getD1Binding(env);
  if (!d1) return;

  if (!(await hasStaleCachedTourApiDetails(d1))) {
    console.info('[cron] detail refresh skipped reason=no-pending-details');
    return;
  }

  const lockOwner = await acquireInitializeLock(env);
  if (!lockOwner) {
    console.info('[cron] detail refresh skipped reason=lock-busy');
    return;
  }

  const heartbeat = startInitializeLockHeartbeat(env, lockOwner);
  try {
    await heartbeat.ensureHeld();
    const refreshed = await refreshStaleCachedTourApiDetails(
      { baseUrl: env.TOUR_API_BASE_URL || TOUR_API_BASE_URL, serviceKey: env.TOUR_API_KEY },
      d1,
      { beforeEach: () => heartbeat.renew() }
    );
    console.info(`[cron] detail refresh completed refreshed=${refreshed}`);
    // Detail enrichment updates the detail cache and summary columns, but does not change
    // the event list shape enough to invalidate the full list cache on every 5-minute run.
  } finally {
    await heartbeat.stop();
    await releaseInitializeLock(env, lockOwner);
  }
}

const worker = {
  async fetch(request, env, ctx) {
    return openNextWorker.fetch(request, env, ctx);
  },
  async scheduled(event, env, ctx) {
    const job = getCultureScheduledJob(event.cron);
    console.info(`[cron] received job=${job} cron=${event.cron} scheduledAt=${new Date(event.scheduledTime).toISOString()}`);

    try {
      if (job === 'detail-refresh') {
        try {
          await runScheduledDetailRefresh(env);
        } catch (error) {
          if (hasD1DailyRowReadLimitError(error)) {
            console.warn('[cron] detail refresh skipped reason=d1-daily-row-read-limit');
            return;
          }
          if (hasD1DailyRowWriteLimitError(error)) {
            console.warn('[cron] detail refresh skipped reason=d1-daily-row-write-limit');
            return;
          }
          throw error;
        }
        return;
      }

      if (job === 'snapshot') {
        const scheduledHour = new Date(event.scheduledTime).getUTCHours();
        const trigger = scheduledHour === RECOVERY_SYNC_UTC_HOUR ? 'cron-recovery' : 'cron';
        await runScheduledSync(env, ctx, trigger);
        return;
      }

      console.warn(`[cron] ignored unknown schedule cron=${event.cron}`);
    } catch (error) {
      if (hasD1DailyRowWriteLimitError(error)) {
        console.error(`[cron] failed job=${job} reason=d1-daily-row-write-limit`, error);
      } else {
        console.error(`[cron] failed job=${job}`, error);
      }
      throw error;
    }
  },
};

export default worker;
export { BucketCachePurge, DOQueueHandler, DOShardedTagCache };
