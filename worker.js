import openNextWorker, { BucketCachePurge, DOQueueHandler, DOShardedTagCache } from './.open-next/worker.js';
import { acquireInitializeLock, releaseInitializeLock } from './src/services/cultureSyncLock';
import { RECOVERY_SYNC_UTC_HOUR, shouldRunScheduledSync } from './src/services/cultureSyncSchedule';
import { syncCultures } from './src/services/cultureSyncService';

function resolveSeoulApiUrl(env) {
  if (env.SEOUL_API_CULTURAL_BASE_URL && env.SEOUL_API_KEY) {
    return `${env.SEOUL_API_CULTURAL_BASE_URL.replace(/\/$/, '')}/${env.SEOUL_API_KEY}/json/culturalEventInfo`;
  }

  return env.SEOUL_API_CULTURAL_URL;
}

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

  const baseUrl = resolveSeoulApiUrl(env);
  if (!baseUrl) {
    throw new Error('Seoul cultural API URL is required for scheduled synchronization');
  }

  const lockOwner = await acquireInitializeLock(env);
  if (!lockOwner) {
    return;
  }

  try {
    await syncCultures(baseUrl, env.DB, { trigger });
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
