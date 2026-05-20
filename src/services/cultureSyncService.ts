import { bumpCulturesCacheVersion } from '@/cache/kv';
import { mapRawCultureToCulture } from '@/services/cultureService';

import { deduplicateCultureRows, normalizeAndValidateCultureRows } from './cultureSyncNormalize';
import { replaceCulturesViaStaging } from './cultureSyncRepository';
import { fetchCulturesFromSeoul } from './cultureSyncSource';
import { D1Binding, SyncResult } from './cultureSyncTypes';

export const syncCultures = async (baseUrl: string, d1: D1Binding): Promise<SyncResult> => {
  const externalRows = await fetchCulturesFromSeoul(baseUrl);
  if (externalRows.length === 0) {
    throw new Error('외부 API에서 가져온 데이터가 없습니다.');
  }

  const mappedRows = externalRows.map(mapRawCultureToCulture);
  if (mappedRows.length === 0) {
    throw new Error('외부 API에서 유효한 문화 데이터를 가져오지 못했습니다.');
  }

  const normalizedRows = normalizeAndValidateCultureRows(mappedRows);
  const deduplicatedRows = deduplicateCultureRows(normalizedRows);

  if (deduplicatedRows.length === 0) {
    throw new Error('중복 제거 이후 남은 문화 데이터가 없습니다.');
  }

  const insertStats = await replaceCulturesViaStaging(d1, deduplicatedRows);
  await bumpCulturesCacheVersion();

  return {
    fetched: externalRows.length,
    inserted: insertStats.inserted,
    skipped: insertStats.skipped,
    normalized: normalizedRows.length,
    deduplicated: deduplicatedRows.length,
  };
};
