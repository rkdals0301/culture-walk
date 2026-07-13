import openNextWorker, { BucketCachePurge, DOQueueHandler, DOShardedTagCache } from './.open-next/worker.js';
import { RECOVERY_SYNC_CRON, shouldRunRecoverySync } from './src/services/cultureSyncSchedule';

async function runScheduledInitialize(env, ctx, options = {}) {
  if (!env.SYNC_TOKEN) {
    throw new Error('SYNC_TOKEN is required for scheduled initialize');
  }

  const url = new URL('https://internal.culturewalk/api/initialize');

  const request = new Request(url, {
    method: 'POST',
    headers: {
      'x-sync-token': env.SYNC_TOKEN,
      'x-sync-trigger': options.trigger ?? 'cron',
      ...(options.force ? { 'x-sync-force': 'true' } : {}),
      'user-agent': 'culturewalk-cron-initialize',
    },
  });

  const response = await openNextWorker.fetch(request, env, ctx);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Scheduled initialize failed with ${response.status}: ${message}`);
  }
}

async function runScheduledRecovery(env, ctx) {
  const healthResponse = await openNextWorker.fetch(
    new Request('https://internal.culturewalk/api/health'),
    env,
    ctx
  );

  if (healthResponse.ok) {
    const health = await healthResponse.json();
    if (!shouldRunRecoverySync(health)) {
      return;
    }
  }

  await runScheduledInitialize(env, ctx, { force: true, trigger: 'cron-recovery' });
}

const worker = {
  async fetch(request, env, ctx) {
    return openNextWorker.fetch(request, env, ctx);
  },
  async scheduled(event, env, ctx) {
    const task = event.cron === RECOVERY_SYNC_CRON
      ? runScheduledRecovery(env, ctx)
      : runScheduledInitialize(env, ctx);

    ctx.waitUntil(task);
  },
};

export default worker;
export { BucketCachePurge, DOQueueHandler, DOShardedTagCache };
