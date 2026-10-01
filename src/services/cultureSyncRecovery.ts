import {
  readCultureReadModelCache,
  readCultureSyncHealthMetadataCache,
  writeCultureSyncHealthMetadataCache,
} from '@/cache/kv';
import type { CultureCacheBinding, D1Binding } from '@/server/runtimeTypes';
import { queryCultureListFromD1 } from '@/services/cultureListRepository';
import { refreshCulturePublicReadModelsAfterDetailRefresh } from '@/services/cultureSyncDetails';
import type { CultureSyncRunState } from '@/services/cultureSyncRunRepository';

export const inspectCulturePublicReadModelRecovery = async (
  d1: D1Binding,
  cache: CultureCacheBinding | undefined,
  run: CultureSyncRunState
) => {
  if (!cache) throw new Error('Public read model recovery requires a KV binding');
  const [snapshot, expected, syncHealth] = await Promise.all([
    readCultureReadModelCache(cache),
    queryCultureListFromD1(d1),
    readCultureSyncHealthMetadataCache(cache),
  ]);
  const snapshotMatches = snapshot !== null &&
    Date.parse(snapshot.cachedAt ?? '') >= Date.parse(run.startedAt ?? '') &&
    JSON.stringify(snapshot.items) === JSON.stringify(expected.items) &&
    JSON.stringify(snapshot.revisions ?? {}) === JSON.stringify(expected.revisions);

  // D1 timestamps have second precision while the initial KV completion time
  // may include milliseconds. Do not rewrite matching metadata unnecessarily.
  const syncHealthMatches = run.completedAt !== null &&
    Math.floor(Date.parse(syncHealth?.completedAt ?? '') / 1000) ===
    Math.floor(Date.parse(run.completedAt) / 1000);
  return { needsReadModelRepair: !snapshotMatches, needsSyncHealthRepair: !syncHealthMatches };
};

/** Recover cache publication after a successful source sync without applying
 * another snapshot or incrementing the missing-event counters. The caller
 * holds the same lease used by source and detail synchronization. */
export const recoverCulturePublicReadModels = async (
  d1: D1Binding,
  cache: CultureCacheBinding | undefined,
  run: CultureSyncRunState,
  ensureHeld: () => Promise<void>
) => {
  const status = await inspectCulturePublicReadModelRecovery(d1, cache, run);
  let readModelRepaired = false;
  if (status.needsReadModelRepair) {
    await ensureHeld();
    const publication = await refreshCulturePublicReadModelsAfterDetailRefresh(d1, cache);
    if (!publication.published) throw new Error('Public read model recovery publication failed');
    readModelRepaired = true;
  }
  let syncHealthRepaired = false;
  if (status.needsSyncHealthRepair && run.completedAt) {
    await ensureHeld();
    syncHealthRepaired = await writeCultureSyncHealthMetadataCache({ completedAt: run.completedAt }, cache);
    if (!syncHealthRepaired) throw new Error('Public read model sync health recovery publication failed');
  }
  return { readModelRepaired, syncHealthRepaired };
};
