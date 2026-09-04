import { bumpCulturesCacheVersion } from '@/cache/kv';
import { mapTourApiFestivalToCulture } from '@/services/cultureService';

import { refreshStaleCachedTourApiDetails } from './cultureSyncDetails';
import { deduplicateCultureRows, normalizeAndValidateCultureRows } from './cultureSyncNormalize';
import { reconcileCulturesViaStaging } from './cultureSyncRepository';
import { completeCultureSyncRun, createCultureSyncRun, failCultureSyncRun } from './cultureSyncRunRepository';
import { fetchCulturesFromTourApi } from './cultureSyncSource';
import { D1Binding, INITIALIZE_LOCK_LEASE_LOST_MESSAGE, SyncResult, TourApiConfig } from './cultureSyncTypes';

type SyncCulturesOptions = {
  trigger?: string;
  beforeEach?: () => Promise<boolean>;
  beforeApply?: () => Promise<void>;
};

export const syncCultures = async (
  config: TourApiConfig,
  d1: D1Binding,
  options: SyncCulturesOptions = {}
): Promise<SyncResult> => {
  const trigger = options.trigger?.trim().slice(0, 32) || 'manual';
  let runId: number | null = null;

  try {
    runId = await createCultureSyncRun(d1, trigger);
  } catch (error) {
    console.error('동기화 실행 이력 생성을 실패했습니다.', error);
  }

  try {
    const externalRows = await fetchCulturesFromTourApi(config);
    if (externalRows.length === 0) {
      throw new Error('외부 API에서 가져온 데이터가 없습니다.');
    }

    const mappedRows = externalRows.map(mapTourApiFestivalToCulture);
    const normalization = normalizeAndValidateCultureRows(mappedRows);
    const deduplicatedRows = deduplicateCultureRows(normalization.rows);

    if (deduplicatedRows.length === 0) {
      throw new Error('검증과 중복 제거 이후 남은 문화 데이터가 없습니다.');
    }

    const stagingRunKey = `sync:${runId ?? 'untracked'}:${crypto.randomUUID()}`;
    const snapshotStats = await reconcileCulturesViaStaging(d1, deduplicatedRows, stagingRunKey, {
      beforeEach: options.beforeEach,
      beforeApply: options.beforeApply,
    });
    await bumpCulturesCacheVersion();

    // Detail enrichment is best-effort: the core snapshot remains authoritative and must not fail because of it.
    // It does not bump the list cache version; the list cache can expire naturally after summary updates.
    try {
      await refreshStaleCachedTourApiDetails(config, d1, {
        beforeEach: options.beforeEach,
      });
    } catch (error) {
      if (error instanceof Error && error.message === INITIALIZE_LOCK_LEASE_LOST_MESSAGE) {
        throw error;
      }
      console.warn('TourAPI 상세 캐시 보강을 건너뜁니다.', error);
    }

    if (options.beforeEach && !(await options.beforeEach())) {
      throw new Error(INITIALIZE_LOCK_LEASE_LOST_MESSAGE);
    }

    const result: SyncResult = {
      runId,
      fetched: externalRows.length,
      inserted: snapshotStats.inserted,
      updated: snapshotStats.updated,
      reactivated: snapshotStats.reactivated,
      deactivated: snapshotStats.deactivated,
      skipped: snapshotStats.skipped + normalization.invalidDateCount + normalization.missingRequiredFieldCount,
      normalized: normalization.rows.length,
      deduplicated: deduplicatedRows.length,
      invalidCoordinates: normalization.invalidCoordinateCount,
      invalidDates: normalization.invalidDateCount,
      missingRequiredFields: normalization.missingRequiredFieldCount,
    };

    if (runId !== null) {
      try {
        await completeCultureSyncRun(d1, runId, result);
      } catch (error) {
        console.error('동기화 성공 이력 저장에 실패했습니다.', error);
      }
    }

    return result;
  } catch (error) {
    if (runId !== null) {
      try {
        await failCultureSyncRun(d1, runId, error);
      } catch (logError) {
        console.error('동기화 실패 이력 저장에 실패했습니다.', logError);
      }
    }
    throw error;
  }
};
