import type { CultureCacheBinding } from '@/cache/kv';
import { getCultureDetailEdgeCacheTag } from '@/server/httpCache';
import { hasD1DailyRowReadLimitError, hasD1DailyRowWriteLimitError } from '@/server/sqliteError';
import { logEvent } from '@/server/structuredLog';
import { hasStaleCachedTourApiDetails, refreshStaleCachedTourApiDetails } from '@/services/cultureSyncDetails';
import {
  getD1Binding,
  runWithInitializeLock,
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
  const startedAt = Date.now();
  logEvent('info', 'culture.snapshot.check_started', { trigger });
  const healthResponse = await internalFetch(new Request('https://internal.culturewalk/api/health'), env, ctx);

  if (healthResponse.ok) {
    const health = (await healthResponse.json()) as {
      latestSync?: { status?: unknown; ageHours?: unknown } | null;
    };
    if (!shouldRunScheduledSync(health)) {
      logEvent('info', 'culture.snapshot.skipped', { trigger, reason: 'fresh-sync' });
      return;
    }
  }

  if (!env.DB) throw new Error('DB binding is required for scheduled synchronization');
  if (!env.TOUR_API_KEY) throw new Error('TOUR_API_KEY is required for scheduled synchronization');

  const lockedRun = await runWithInitializeLock(env, async heartbeat => {
    const result = await syncCultures(
      { baseUrl: env.TOUR_API_BASE_URL || TOUR_API_BASE_URL, serviceKey: env.TOUR_API_KEY as string },
      env.DB as D1Binding,
      {
        trigger,
        beforeEach: () => heartbeat.renew(),
        beforeApply: heartbeat.ensureHeld,
        cache: env.CULTURE_CACHE,
      }
    );
    logEvent('info', 'culture.snapshot.completed', {
      trigger,
      runId: result.runId,
      fetched: result.fetched,
      inserted: result.inserted,
      updated: result.updated,
      durationMs: Date.now() - startedAt,
    });
    await purgeCultureEdgeCache(ctx, CULTURE_PUBLIC_CACHE_TAGS, `snapshot-${trigger}`);
    return result;
  });

  if (!lockedRun.acquired) {
    logEvent('warn', 'culture.snapshot.skipped', { trigger, reason: 'lock-busy' });
    return;
  }
};

const runScheduledDetailRefresh = async (env: ScheduledCultureEnv, ctx: CultureEdgeCacheContext) => {
  if (!env.DB || !env.TOUR_API_KEY) return;
  const d1 = getD1Binding(env);
  if (!d1) return;

  if (!(await hasStaleCachedTourApiDetails(d1))) {
    logEvent('info', 'culture.detail_refresh.skipped', { reason: 'no-pending-details' });
    return;
  }

  const startedAt = Date.now();
  const lockedRun = await runWithInitializeLock(env, async heartbeat => {
    const result = await refreshStaleCachedTourApiDetails(
      { baseUrl: env.TOUR_API_BASE_URL || TOUR_API_BASE_URL, serviceKey: env.TOUR_API_KEY as string },
      d1,
      { beforeEach: () => heartbeat.renew(), cache: env.CULTURE_CACHE }
    );
    logEvent('info', 'culture.detail_refresh.completed', {
      refreshed: result.refreshed,
      durationMs: Date.now() - startedAt,
    });
    if (result.refreshedCultureIds.length > 0) {
      await purgeCultureEdgeCache(
        ctx,
        Array.from(new Set(result.refreshedCultureIds)).map(getCultureDetailEdgeCacheTag),
        'detail-refresh'
      );
    }
    return result;
  });

  if (!lockedRun.acquired) {
    logEvent('info', 'culture.detail_refresh.skipped', { reason: 'lock-busy' });
    return;
  }
};

export const runCultureScheduledEvent = async (
  event: CultureScheduledEvent,
  env: ScheduledCultureEnv,
  ctx: CultureEdgeCacheContext,
  internalFetch: InternalFetch
) => {
  const job = getCultureScheduledJob(event.cron);
  logEvent('info', 'culture.cron.received', {
    job,
    cron: event.cron,
    scheduledAt: new Date(event.scheduledTime).toISOString(),
  });

  try {
    if (job === 'detail-refresh') {
      try {
        await runScheduledDetailRefresh(env, ctx);
      } catch (error) {
        if (hasD1DailyRowReadLimitError(error)) {
          logEvent('warn', 'culture.detail_refresh.skipped', { reason: 'd1-daily-row-read-limit' });
          return;
        }
        if (hasD1DailyRowWriteLimitError(error)) {
          logEvent('warn', 'culture.detail_refresh.skipped', { reason: 'd1-daily-row-write-limit' });
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

    logEvent('warn', 'culture.cron.ignored', { cron: event.cron, reason: 'unknown-schedule' });
  } catch (error) {
    logEvent(
      'error',
      'culture.cron.failed',
      {
        job,
        reason: hasD1DailyRowWriteLimitError(error) ? 'd1-daily-row-write-limit' : 'unexpected-error',
      },
      error
    );
    throw error;
  }
};
