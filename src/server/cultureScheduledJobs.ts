import type { CultureCacheBinding } from '@/cache/kv';
import { getCultureDetailEdgeCacheTag } from '@/server/httpCache';
import { hasD1DailyRowReadLimitError, hasD1DailyRowWriteLimitError } from '@/server/sqliteError';
import { hasStaleCachedTourApiDetails, refreshStaleCachedTourApiDetails } from '@/services/cultureSyncDetails';
import {
  acquireInitializeLock,
  getD1Binding,
  releaseInitializeLock,
  startInitializeLockHeartbeat,
} from '@/services/cultureSyncLock';
import { getCultureScheduledJob, RECOVERY_SYNC_UTC_HOUR, shouldRunScheduledSync } from '@/services/cultureSyncSchedule';
import { syncCultures } from '@/services/cultureSyncService';
import { type D1Binding, TOUR_API_BASE_URL } from '@/services/cultureSyncTypes';

import {
  CULTURE_PUBLIC_CACHE_TAGS,
  type CultureEdgeCacheContext,
  purgeCultureEdgeCache,
} from './cultureEdgeCache';

interface ScheduledCultureEnv {
  DB?: D1Binding;
  CULTURE_CACHE?: CultureCacheBinding;
  TOUR_API_BASE_URL?: string;
  TOUR_API_KEY?: string;
}

interface CultureScheduledEvent {
  cron: string;
  scheduledTime: number;
}

type InternalFetch = (request: Request, env: ScheduledCultureEnv, ctx: CultureEdgeCacheContext) => Promise<Response>;

const runScheduledSync = async (
  env: ScheduledCultureEnv,
  ctx: CultureEdgeCacheContext,
  trigger: string,
  internalFetch: InternalFetch
) => {
  console.info(`[cron] snapshot check started trigger=${trigger}`);
  const healthResponse = await internalFetch(new Request('https://internal.culturewalk/api/health'), env, ctx);

  if (healthResponse.ok) {
    const health = (await healthResponse.json()) as {
      latestSync?: { status?: unknown; ageHours?: unknown } | null;
    };
    if (!shouldRunScheduledSync(health)) {
      console.info(`[cron] snapshot skipped trigger=${trigger} reason=fresh-sync`);
      return;
    }
  }

  if (!env.DB) throw new Error('DB binding is required for scheduled synchronization');
  if (!env.TOUR_API_KEY) throw new Error('TOUR_API_KEY is required for scheduled synchronization');

  const lockOwner = await acquireInitializeLock(env);
  if (!lockOwner) {
    console.warn(`[cron] snapshot skipped trigger=${trigger} reason=lock-busy`);
    return;
  }

  const heartbeat = startInitializeLockHeartbeat(env, lockOwner);
  try {
    await heartbeat.ensureHeld();
    const result = await syncCultures(
      { baseUrl: env.TOUR_API_BASE_URL || TOUR_API_BASE_URL, serviceKey: env.TOUR_API_KEY },
      env.DB,
      {
        trigger,
        beforeEach: () => heartbeat.renew(),
        beforeApply: heartbeat.ensureHeld,
        cache: env.CULTURE_CACHE,
      }
    );
    console.info(
      `[cron] snapshot completed trigger=${trigger} fetched=${result.fetched} inserted=${result.inserted} updated=${result.updated}`
    );
    await purgeCultureEdgeCache(ctx, CULTURE_PUBLIC_CACHE_TAGS, `snapshot-${trigger}`);
  } finally {
    await heartbeat.stop();
    await releaseInitializeLock(env, lockOwner);
  }
};

const runScheduledDetailRefresh = async (env: ScheduledCultureEnv, ctx: CultureEdgeCacheContext) => {
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
    const { refreshed, refreshedCultureIds } = await refreshStaleCachedTourApiDetails(
      { baseUrl: env.TOUR_API_BASE_URL || TOUR_API_BASE_URL, serviceKey: env.TOUR_API_KEY },
      d1,
      { beforeEach: () => heartbeat.renew(), cache: env.CULTURE_CACHE }
    );
    console.info(`[cron] detail refresh completed refreshed=${refreshed}`);
    if (refreshedCultureIds.length > 0) {
      await purgeCultureEdgeCache(
        ctx,
        Array.from(new Set(refreshedCultureIds)).map(getCultureDetailEdgeCacheTag),
        'detail-refresh'
      );
    }
  } finally {
    await heartbeat.stop();
    await releaseInitializeLock(env, lockOwner);
  }
};

export const runCultureScheduledEvent = async (
  event: CultureScheduledEvent,
  env: ScheduledCultureEnv,
  ctx: CultureEdgeCacheContext,
  internalFetch: InternalFetch
) => {
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
      await runScheduledSync(env, ctx, trigger, internalFetch);
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
};
