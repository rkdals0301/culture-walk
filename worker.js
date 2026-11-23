import openNextWorker, { BucketCachePurge, DOQueueHandler, DOShardedTagCache } from './.open-next/worker.js';
import {
  CULTURE_PUBLIC_CACHE_TAGS,
  purgeCultureEdgeCache,
  withOptimizedImageEdgeCache,
  withStaticAssetEdgeCache,
  withCulturePageEdgeCache,
  withSitemapEdgeCache,
} from './src/server/cultureEdgeCache';
import { runCultureScheduledEvent } from './src/server/cultureScheduledJobs';
import { withWorkerResponseTiming } from './src/server/serverTiming';

const worker = {
  async fetch(request, env, ctx) {
    const startedAt = performance.now();
    const response = withWorkerResponseTiming(request, await openNextWorker.fetch(request, env, ctx), performance.now() - startedAt);
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/api/initialize' && response.ok) {
      ctx.waitUntil(purgeCultureEdgeCache(ctx, CULTURE_PUBLIC_CACHE_TAGS, 'manual-sync'));
    }

    if ((request.method === 'GET' || request.method === 'HEAD') && url.pathname === '/sitemap.xml') {
      return withSitemapEdgeCache(response);
    }

    const cacheableResponse = withOptimizedImageEdgeCache(request, response);
    return withCulturePageEdgeCache(request, withStaticAssetEdgeCache(request, cacheableResponse));
  },
  async scheduled(event, env, ctx) {
    await runCultureScheduledEvent(event, env, ctx);
  },
};

export default worker;
export { BucketCachePurge, DOQueueHandler, DOShardedTagCache };
