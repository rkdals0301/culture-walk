export const SYNC_CRON = '10 0,1 * * *';
export const DETAIL_REFRESH_CRON = '17 * * * *';
export const RECOVERY_SYNC_UTC_HOUR = 1;
export const RECOVERY_FRESHNESS_HOURS = 2;

export type CultureScheduledJob = 'snapshot' | 'detail-refresh' | 'unknown';

export const getCultureScheduledJob = (cron: string): CultureScheduledJob => {
  if (cron === SYNC_CRON) return 'snapshot';
  if (cron === DETAIL_REFRESH_CRON) return 'detail-refresh';
  return 'unknown';
};

interface SyncHealthPayload {
  latestSync?: {
    status?: unknown;
    ageHours?: unknown;
  } | null;
}

export const shouldRunScheduledSync = (health: SyncHealthPayload | null) => {
  const latestSync = health?.latestSync;
  if (!latestSync || latestSync.status !== 'success') {
    return true;
  }

  return (
    typeof latestSync.ageHours !== 'number' ||
    !Number.isFinite(latestSync.ageHours) ||
    latestSync.ageHours > RECOVERY_FRESHNESS_HOURS
  );
};
