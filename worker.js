import openNextWorker, { BucketCachePurge, DOQueueHandler, DOShardedTagCache } from './.open-next/worker.js';
import {
  CULTURE_PUBLIC_CACHE_TAGS,
  purgeCultureEdgeCache,
  withSitemapEdgeCache,
} from './src/server/cultureEdgeCache';
import { runCultureScheduledEvent } from './src/server/cultureScheduledJobs';

const worker = {
  async fetch(request, env, ctx) {
    const response = await openNextWorker.fetch(request, env, ctx);
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/api/initialize' && response.ok) {
      ctx.waitUntil(purgeCultureEdgeCache(ctx, CULTURE_PUBLIC_CACHE_TAGS, 'manual-sync'));
    }

    if ((request.method === 'GET' || request.method === 'HEAD') && url.pathname === '/sitemap.xml') {
      return withSitemapEdgeCache(response);
    }

    return response;
  },
  async scheduled(event, env, ctx) {
    await runCultureScheduledEvent(event, env, ctx, (request, runtimeEnv, runtimeCtx) =>
      openNextWorker.fetch(request, runtimeEnv, runtimeCtx)
    );
  },
};

export default worker;
export { BucketCachePurge, DOQueueHandler, DOShardedTagCache };
