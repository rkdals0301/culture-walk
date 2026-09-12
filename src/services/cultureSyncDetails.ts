import { type CultureCacheBinding, readCultureReadModelCache, writeCultureDetailCache } from '@/cache/kv';
import { mapCultureRowToCulture } from '@/services/cultureService';

import { DETAIL_READ_MODEL_TTL_SECONDS, publishCurrentCultureDetailReadModels } from './cultureDetailReadModelPublisher';
import { getTourApiContentId } from './cultureIdentity';
import {
  hasStaleCachedTourApiDetails,
  persistCultureDetailRefreshFailure,
  persistCultureDetailRefreshSuccess,
  readStaleCultureDetailRows,
  requestCultureDetailRefresh,
  type StaleDetailRow,
} from './cultureSyncDetailRepository';
import { fetchTourApiFestivalDetails } from './cultureSyncSource';
import { type D1Binding, INITIALIZE_LOCK_LEASE_LOST_MESSAGE, type TourApiConfig } from './cultureSyncTypes';

export { hasStaleCachedTourApiDetails, publishCurrentCultureDetailReadModels, requestCultureDetailRefresh };

const retryDelayMinutes = (failCount: number, sourceKey: string) => {
  const base = failCount <= 1 ? 10 : failCount === 2 ? 30 : Math.min(120 * 2 ** (failCount - 3), 24 * 60);
  let hash = 0;
  for (let index = 0; index < sourceKey.length; index += 1) hash = (hash * 31 + sourceKey.charCodeAt(index)) | 0;
  return Math.min(24 * 60, Math.max(1, Math.round(base * (0.9 + (Math.abs(hash) % 21) / 100))));
};

const refreshCachedDetail = async (
  config: TourApiConfig,
  d1: D1Binding,
  row: StaleDetailRow,
  beforeWrite?: () => Promise<boolean>,
  cache?: CultureCacheBinding,
  cacheVersion = 'detail-refresh',
) => {
  const cultureId = Number(row.id);
  const sourceKey = row.sourceKey;
  const contentId = getTourApiContentId(sourceKey);

  if (!Number.isInteger(cultureId) || !sourceKey || !contentId) return false;

  const details = await fetchTourApiFestivalDetails(config, contentId);
  if (!details.complete) {
    throw new Error(`TourAPI 상세정보 일부 조회로 저장하지 않습니다. sourceKey=${sourceKey}`);
  }

  if (beforeWrite && !(await beforeWrite())) {
    throw new Error(INITIALIZE_LOCK_LEASE_LOST_MESSAGE);
  }

  const syncedAt = new Date().toISOString();
  await persistCultureDetailRefreshSuccess(d1, row, details, syncedAt);

  if (cache) {
    const culture = mapCultureRowToCulture({ ...row, updatedAt: syncedAt }, details);
    await writeCultureDetailCache(cultureId, cacheVersion, culture, DETAIL_READ_MODEL_TTL_SECONDS, cache);
  }

  return true;
};

export const refreshStaleCachedTourApiDetails = async (
  config: TourApiConfig,
  d1: D1Binding,
  options: {
    beforeEach?: () => Promise<boolean>;
    cache?: CultureCacheBinding;
    readModelRevisions?: Record<string, string>;
  } = {}
) => {
  const rows = await readStaleCultureDetailRows(d1);
  const readModel = options.readModelRevisions
    ? null
    : options.cache
      ? await readCultureReadModelCache(options.cache)
      : null;
  const readModelRevisions = options.readModelRevisions ?? readModel?.revisions ?? {};
  let refreshed = 0;
  const refreshedCultureIds: number[] = [];

  for (const row of rows) {
    if (options.beforeEach && !(await options.beforeEach())) {
      throw new Error(INITIALIZE_LOCK_LEASE_LOST_MESSAGE);
    }
    try {
      const cultureId = Number(row.id);
      const didRefresh = await refreshCachedDetail(
        config,
        d1,
        row,
        options.beforeEach,
        options.cache,
        readModelRevisions[String(row.id)] ?? 'legacy-read-model'
      );
      if (didRefresh) {
        refreshed += 1;
        if (Number.isInteger(cultureId) && cultureId > 0) refreshedCultureIds.push(cultureId);
      }
    } catch (error) {
      if (error instanceof Error && error.message === INITIALIZE_LOCK_LEASE_LOST_MESSAGE) throw error;

      if (options.beforeEach && !(await options.beforeEach())) {
        throw new Error(INITIALIZE_LOCK_LEASE_LOST_MESSAGE);
      }

      const sourceKey = String(row.sourceKey ?? '');
      const failCount = Number(row.detailSyncFailCount ?? 0) + 1;
      const retryAt = new Date(Date.now() + retryDelayMinutes(failCount, sourceKey) * 60 * 1000).toISOString();
      const message = error instanceof Error ? error.message : '상세 API 요청 실패';
      await persistCultureDetailRefreshFailure(d1, sourceKey, failCount, retryAt, message);
      console.warn(`TourAPI 상세 캐시 보강을 재시도합니다. sourceKey=${sourceKey}`, error);
    }
  }

  return { refreshed, refreshedCultureIds };
};
