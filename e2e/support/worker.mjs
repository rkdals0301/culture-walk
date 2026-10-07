import worker from '../../worker.js';
export { BucketCachePurge, DOQueueHandler, DOShardedTagCache } from '../../worker.js';

// This entrypoint is used only by the isolated local E2E server. Production
// continues to deploy worker.js and cannot accept this test-only delay header.
const testWorker = {
  ...worker,
  fetch(request, env, ctx) {
    const delayMs = Math.min(2000, Math.max(0, Number(request.headers.get('x-culture-test-kv-delay')) || 0));
    if (!delayMs || !env.CULTURE_CACHE) return worker.fetch(request, env, ctx);
    const cache = env.CULTURE_CACHE;
    return worker.fetch(request, {
      ...env,
      CULTURE_CACHE: {
        async get(...args) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
          return cache.get(...args);
        },
        put: (...args) => cache.put(...args),
      },
    }, ctx);
  },
};

export default testWorker;
