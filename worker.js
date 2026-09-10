import openNextWorker, { BucketCachePurge, DOQueueHandler, DOShardedTagCache } from './.open-next/worker.js';
import { CULTURE_EDGE_CACHE_TAGS } from './src/server/httpCache';
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

const CULTURE_PUBLIC_CACHE_TAGS = [
  CULTURE_EDGE_CACHE_TAGS.all,
  CULTURE_EDGE_CACHE_TAGS.list,
  CULTURE_EDGE_CACHE_TAGS.detail,
  CULTURE_EDGE_CACHE_TAGS.sitemap,
];

async function purgeCultureEdgeCache(ctx, tags, reason) {
  if (!ctx?.cache?.purge) {
    console.info(`[edge-cache] purge skipped reason=${reason} cache-api-unavailable`);
    return;
  }

  try {
    const result = await ctx.cache.purge({ tags });
    if (result?.success === false) {
      console.warn(`[edge-cache] purge failed reason=${reason}`, result.errors ?? []);
      return;
    }
    console.info(`[edge-cache] purge completed reason=${reason} tags=${tags.join(',')}`);
  } catch (error) {
    console.warn(`[edge-cache] purge failed reason=${reason}`, error);
  }
}

const withSitemapEdgeCache = response => {
  if (!response.ok) return response;

  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'public, max-age=300');
  headers.set(
    'Cloudflare-CDN-Cache-Control',
    'public, max-age=3600, stale-while-revalidate=86400, stale-if-error=86400'
  );
  headers.set('Cache-Tag', `${CULTURE_EDGE_CACHE_TAGS.all},${CULTURE_EDGE_CACHE_TAGS.sitemap}`);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

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
      cache: env.CULTURE_CACHE,
    });
    console.info(
      `[cron] snapshot completed trigger=${trigger} fetched=${result.fetched} inserted=${result.inserted} updated=${result.updated}`
    );
    await purgeCultureEdgeCache(ctx, CULTURE_PUBLIC_CACHE_TAGS, `snapshot-${trigger}`);
  } finally {
    await heartbeat.stop();
    await releaseInitializeLock(env, lockOwner);
  }
}

async function runScheduledDetailRefresh(env, ctx) {
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
      { beforeEach: () => heartbeat.renew(), cache: env.CULTURE_CACHE }
    );
    console.info(`[cron] detail refresh completed refreshed=${refreshed}`);
    if (refreshed > 0) {
      await purgeCultureEdgeCache(ctx, [CULTURE_EDGE_CACHE_TAGS.all, CULTURE_EDGE_CACHE_TAGS.detail], 'detail-refresh');
    }
    // Detail enrichment updates the detail cache and summary columns, but does not change
    // the event list shape enough to republish the full list read model on every hourly run.
  } finally {
    await heartbeat.stop();
    await releaseInitializeLock(env, lockOwner);
  }
}

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
    const job = getCultureScheduledJob(event.cron);
    console.info(`[cron] received job=${job} cron=${event.cron} scheduledAt=${new Date(event.scheduledTime).toISOString()}`);

    try {
      if (job === 'detail-refresh') {
        try {
          await runScheduledDetailRefresh(env, ctx);
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
