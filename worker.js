import openNextWorker, { BucketCachePurge, DOQueueHandler, DOShardedTagCache } from './.open-next/worker.js';
import { acquireInitializeLock, releaseInitializeLock } from './src/services/cultureSyncLock';
import { RECOVERY_SYNC_UTC_HOUR, shouldRunScheduledSync } from './src/services/cultureSyncSchedule';
import { syncCultures } from './src/services/cultureSyncService';
import { TOUR_API_BASE_URL } from './src/services/cultureSyncTypes';

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

  try {
    await syncCultures(
      { baseUrl: env.TOUR_API_BASE_URL || TOUR_API_BASE_URL, serviceKey: env.TOUR_API_KEY },
      env.DB,
      { trigger }
    );
  } finally {
    await releaseInitializeLock(env, lockOwner);
  }
}

const worker = {
  async fetch(request, env, ctx) {
    return openNextWorker.fetch(request, env, ctx);
  },
  async scheduled(event, env, ctx) {
    const scheduledHour = new Date(event.scheduledTime).getUTCHours();
    const trigger = scheduledHour === RECOVERY_SYNC_UTC_HOUR ? 'cron-recovery' : 'cron';

    await runScheduledSync(env, ctx, trigger);
  },
};

export default worker;
export { BucketCachePurge, DOQueueHandler, DOShardedTagCache };
