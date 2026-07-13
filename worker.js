import openNextWorker, { BucketCachePurge, DOQueueHandler, DOShardedTagCache } from './.open-next/worker.js';
import { RECOVERY_SYNC_UTC_HOUR, shouldRunScheduledSync } from './src/services/cultureSyncSchedule';

async function runScheduledInitialize(env, ctx, trigger) {
  if (!env.SYNC_TOKEN) {
    throw new Error('SYNC_TOKEN is required for scheduled initialize');
  }

  const url = new URL('https://internal.culturewalk/api/initialize');

  const request = new Request(url, {
    method: 'POST',
    headers: {
      'x-sync-token': env.SYNC_TOKEN,
      'x-sync-trigger': trigger,
      'user-agent': 'culturewalk-cron-initialize',
    },
  });

  const response = await openNextWorker.fetch(request, env, ctx);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Scheduled initialize failed with ${response.status}: ${message}`);
  }
}

async function runScheduledSync(env, ctx, trigger) {
  const healthResponse = await openNextWorker.fetch(new Request('https://internal.culturewalk/api/health'), env, ctx);

  if (healthResponse.ok) {
    const health = await healthResponse.json();
    if (!shouldRunScheduledSync(health)) {
      return;
    }
  }

  await runScheduledInitialize(env, ctx, trigger);
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
