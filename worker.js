import openNextWorker, { BucketCachePurge, DOQueueHandler, DOShardedTagCache } from './.open-next/worker.js';
import { bumpCulturesCacheVersion } from './src/cache/kv';
import { refreshStaleCachedTourApiDetails } from './src/services/cultureSyncDetails';
import {
  acquireInitializeLock,
  getD1Binding,
  releaseInitializeLock,
  startInitializeLockHeartbeat,
} from './src/services/cultureSyncLock';
import { RECOVERY_SYNC_UTC_HOUR, shouldRunScheduledSync } from './src/services/cultureSyncSchedule';
import { syncCultures } from './src/services/cultureSyncService';
import { TOUR_API_BASE_URL } from './src/services/cultureSyncTypes';

const FULL_SNAPSHOT_CRON = '10 19,20 * * *';

async function runScheduledSync(env, ctx, trigger) {
  const healthResponse = await openNextWorker.fetch(new Request('https://internal.culturewalk/api/health'), env, ctx);

  if (healthResponse.ok) {
    const health = await healthResponse.json();
    if (!shouldRunScheduledSync(health)) {
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
    return;
  }

  const heartbeat = startInitializeLockHeartbeat(env, lockOwner);
  try {
    await heartbeat.ensureHeld();
    await syncCultures({ baseUrl: env.TOUR_API_BASE_URL || TOUR_API_BASE_URL, serviceKey: env.TOUR_API_KEY }, env.DB, {
      trigger,
      beforeEach: () => heartbeat.renew(),
      beforeApply: heartbeat.ensureHeld,
    });
  } finally {
    await heartbeat.stop();
    await releaseInitializeLock(env, lockOwner);
  }
}

async function runScheduledDetailRefresh(env) {
  if (!env.DB || !env.TOUR_API_KEY) return;
  const lockOwner = await acquireInitializeLock(env);
  if (!lockOwner) return;

  const heartbeat = startInitializeLockHeartbeat(env, lockOwner);
  try {
    await heartbeat.ensureHeld();
    const d1 = getD1Binding(env);
    if (!d1) return;
    await refreshStaleCachedTourApiDetails(
      { baseUrl: env.TOUR_API_BASE_URL || TOUR_API_BASE_URL, serviceKey: env.TOUR_API_KEY },
      d1,
      { beforeEach: () => heartbeat.renew() }
    );
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
    if (event.cron !== FULL_SNAPSHOT_CRON) {
      ctx.waitUntil(runScheduledDetailRefresh(env));
      return;
    }
    const scheduledHour = new Date(event.scheduledTime).getUTCHours();
    const trigger = scheduledHour === RECOVERY_SYNC_UTC_HOUR ? 'cron-recovery' : 'cron';

    await runScheduledSync(env, ctx, trigger);
  },
};

export default worker;
export { BucketCachePurge, DOQueueHandler, DOShardedTagCache };
