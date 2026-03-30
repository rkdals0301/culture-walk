import openNextWorker, { BucketCachePurge, DOQueueHandler, DOShardedTagCache } from './.open-next/worker.js';

async function runScheduledInitialize(env, ctx) {
  if (!env.SYNC_TOKEN) {
    throw new Error('SYNC_TOKEN is required for scheduled initialize');
  }

  const url = new URL('https://internal.culturewalk/api/initialize');

  const request = new Request(url, {
    method: 'POST',
    headers: {
      'x-sync-token': env.SYNC_TOKEN,
      'x-sync-trigger': 'cron',
      'user-agent': 'culturewalk-cron-initialize',
    },
  });

  const response = await openNextWorker.fetch(request, env, ctx);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Scheduled initialize failed with ${response.status}: ${message}`);
  }
}

const worker = {
  async fetch(request, env, ctx) {
    return openNextWorker.fetch(request, env, ctx);
  },
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(runScheduledInitialize(env, ctx));
  },
};

export default worker;
export { BucketCachePurge, DOQueueHandler, DOShardedTagCache };
