import { CULTURE_EDGE_CACHE_TAGS, getCultureDetailEdgeCacheTag } from '@/server/httpCache';
import { hasD1DailyRowReadLimitError, hasD1DailyRowWriteLimitError } from '@/server/sqliteError';
import { logEvent } from '@/server/structuredLog';
import type { RuntimeEnv } from '@/server/runtimeTypes';
import {
  hasStaleCachedTourApiDetails,
  refreshCulturePublicReadModelsAfterDetailRefresh,
  refreshStaleCachedTourApiDetails,
} from '@/services/cultureSyncDetails';
import {
  getD1Binding,
  runWithInitializeLock,
} from '@/services/cultureSyncLock';
import {
  getCultureScheduledJob,
  MAINTENANCE_SYNC_MAX_AGE_HOURS,
  RECOVERY_FRESHNESS_HOURS,
  RECOVERY_SYNC_UTC_HOUR,
  shouldRunScheduledSync,
} from '@/services/cultureSyncSchedule';
import { syncCultures } from '@/services/cultureSyncService';
import { inspectCulturePublicReadModelRecovery, recoverCulturePublicReadModels } from '@/services/cultureSyncRecovery';
import { type CultureSyncRunState, readLatestCultureSyncRun } from '@/services/cultureSyncRunRepository';
import { TOUR_API_BASE_URL } from '@/services/cultureSyncTypes';

import {
  CULTURE_PUBLIC_CACHE_TAGS,
  type CultureEdgeCacheContext,
  purgeCultureEdgeCache,
} from './cultureEdgeCache';

interface CultureScheduledEvent {
  cron: string;
  scheduledTime: number;
}

const needsSourceSync = (run: CultureSyncRunState | null, maxAgeHours: number) =>
  shouldRunScheduledSync({
    latestSync: run ? {
      status: run.status,
      ageHours: run.completedAt ? (Date.now() - Date.parse(run.completedAt)) / 3_600_000 : null,
    } : null,
  }, maxAgeHours);

const runScheduledSync = async (
  env: RuntimeEnv,
  ctx: CultureEdgeCacheContext,
  trigger: string,
  maxAgeHours = RECOVERY_FRESHNESS_HOURS
) => {
  const startedAt = Date.now();
  logEvent('info', 'culture.snapshot.check_started', { trigger });
  const d1 = getD1Binding(env);
  if (!d1) throw new Error('DB binding is required for scheduled synchronization');

  // Healthy hourly maintenance is read-only. Recheck after taking the lease
  // whenever collection or publication is actually needed.
  const candidate = await readLatestCultureSyncRun(d1);
  if (candidate && !needsSourceSync(candidate, maxAgeHours)) {
    const status = await inspectCulturePublicReadModelRecovery(d1, env.CULTURE_CACHE, candidate);
    if (!status.needsReadModelRepair && !status.needsSyncHealthRepair) {
      logEvent('info', 'culture.snapshot.skipped', { trigger, reason: 'fresh-sync', runId: candidate.id });
      return;
    }
  }

  const lockedRun = await runWithInitializeLock(env, async heartbeat => {
    // Public health is an eventually consistent serving signal. Source-sync
    // decisions must use D1 history, checked after acquiring the lease.
    const latest = await readLatestCultureSyncRun(d1);
    if (latest && !needsSourceSync(latest, maxAgeHours)) {
      const recovery = await recoverCulturePublicReadModels(d1, env.CULTURE_CACHE, latest, heartbeat.ensureHeld);
      if (recovery.readModelRepaired) {
        await purgeCultureEdgeCache(ctx, CULTURE_PUBLIC_CACHE_TAGS, 'snapshot-read-model-recovery');
      }
      logEvent('info', 'culture.snapshot.skipped', {
        trigger, reason: 'fresh-sync', runId: latest.id, ...recovery,
      });
      return null;
    }

    const serviceKey = env.TOUR_API_KEY;
    if (!serviceKey) throw new Error('TOUR_API_KEY is required for scheduled synchronization');
    const result = await syncCultures(
      { baseUrl: env.TOUR_API_BASE_URL || TOUR_API_BASE_URL, serviceKey },
      d1,
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

const runScheduledDetailRefresh = async (env: RuntimeEnv, ctx: CultureEdgeCacheContext) => {
  const serviceKey = env.TOUR_API_KEY;
  if (!serviceKey) return;
  const d1 = getD1Binding(env);
  if (!d1) return;

  if (!(await hasStaleCachedTourApiDetails(d1))) {
    logEvent('info', 'culture.detail_refresh.skipped', { reason: 'no-pending-details' });
    return;
  }

  const startedAt = Date.now();
  const lockedRun = await runWithInitializeLock(env, async heartbeat => {
    const result = await refreshStaleCachedTourApiDetails(
      { baseUrl: env.TOUR_API_BASE_URL || TOUR_API_BASE_URL, serviceKey },
      d1,
      { beforeEach: () => heartbeat.renew() }
    );
    logEvent('info', 'culture.detail_refresh.completed', {
      refreshed: result.refreshed,
      durationMs: Date.now() - startedAt,
    });
    if (result.refreshedCultureIds.length > 0) {
      try {
        const publication = await refreshCulturePublicReadModelsAfterDetailRefresh(d1, env.CULTURE_CACHE);
        if (!publication.published) {
          logEvent('warn', 'culture.detail_refresh.read_model_publish_failed', {
            refreshed: result.refreshed,
          });
        }
      } catch (error) {
        logEvent('warn', 'culture.detail_refresh.read_model_publish_failed', {
          refreshed: result.refreshed,
        }, error);
      }

      await purgeCultureEdgeCache(
        ctx,
        [
          CULTURE_EDGE_CACHE_TAGS.list,
          ...Array.from(new Set(result.refreshedCultureIds)).map(getCultureDetailEdgeCacheTag),
        ],
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
  env: RuntimeEnv,
  ctx: CultureEdgeCacheContext
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
        await runScheduledSync(env, ctx, 'cron-maintenance', MAINTENANCE_SYNC_MAX_AGE_HOURS);
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
      await runScheduledSync(env, ctx, trigger);
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
