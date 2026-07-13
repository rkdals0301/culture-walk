export const SYNC_CRON = '10 19,20 * * *';
export const RECOVERY_SYNC_UTC_HOUR = 20;
export const RECOVERY_FRESHNESS_HOURS = 2;

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
