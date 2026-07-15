import { bumpCulturesCacheVersion } from '@/cache/kv';
import { mapTourApiFestivalToCulture } from '@/services/cultureService';

import { deduplicateCultureRows, normalizeAndValidateCultureRows } from './cultureSyncNormalize';
import { reconcileCulturesViaStaging } from './cultureSyncRepository';
import { completeCultureSyncRun, createCultureSyncRun, failCultureSyncRun } from './cultureSyncRunRepository';
import { fetchCulturesFromTourApi } from './cultureSyncSource';
import { D1Binding, SyncResult, TourApiConfig } from './cultureSyncTypes';

export const syncCultures = async (
  config: TourApiConfig,
  d1: D1Binding,
  options: { trigger?: string } = {}
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
    const snapshotStats = await reconcileCulturesViaStaging(d1, deduplicatedRows, stagingRunKey);
    await bumpCulturesCacheVersion();

    const result: SyncResult = {
      runId,
      fetched: externalRows.length,
      inserted: snapshotStats.inserted,
      updated: snapshotStats.updated,
      reactivated: snapshotStats.reactivated,
      deactivated: snapshotStats.deactivated,
      skipped:
        snapshotStats.skipped + normalization.invalidDateCount + normalization.missingRequiredFieldCount,
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
