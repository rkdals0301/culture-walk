import { NewCultureRow } from '@/db/schema';

import {
  MAX_SKIPPED_ROW_RATIO,
  MIN_SNAPSHOT_EXISTING_RATIO,
  MIN_VALID_COORDINATE_COUNT,
  type D1Binding,
  type SnapshotStats,
} from './cultureSyncTypes';
import {
  cleanupCultureSyncStagingRun,
  clearCultureSyncStagingRows,
  ensureCultureSyncStagingTable,
  stageCultureRows,
} from './cultureSyncStaging';
import {
  applyCultureSnapshot,
  createCultureContentDifferenceSql,
  readCultureSnapshotStats,
} from './cultureSyncSnapshot';

export { createCultureContentDifferenceSql, ensureCultureSyncStagingTable };

export const reconcileCulturesViaStaging = async (
  d1: D1Binding,
  rows: NewCultureRow[],
  stagingRunKey: string,
  options: {
    beforeEach?: () => Promise<boolean>;
    beforeApply?: () => Promise<void>;
  } = {}
): Promise<SnapshotStats> => {
  await ensureCultureSyncStagingTable(d1);
  await clearCultureSyncStagingRows(d1, stagingRunKey);

  const insertStats = await stageCultureRows(d1, rows, stagingRunKey, options.beforeEach);
  const skippedRatio = insertStats.skipped / rows.length;
  console.info(
    `staging insert 완료: inserted=${insertStats.inserted}, skipped=${insertStats.skipped}, total=${rows.length}`
  );

  if (insertStats.inserted < MIN_VALID_COORDINATE_COUNT || skippedRatio > MAX_SKIPPED_ROW_RATIO) {
    throw new Error(
      `staging insert 결과가 비정상입니다. inserted=${insertStats.inserted}, skipped=${insertStats.skipped}, total=${rows.length}`
    );
  }

  const stats = await readCultureSnapshotStats(d1, stagingRunKey);
  if (
    stats.currentSourceActive >= MIN_VALID_COORDINATE_COUNT &&
    stats.staged / stats.currentSourceActive < MIN_SNAPSHOT_EXISTING_RATIO
  ) {
    throw new Error(
      `TourAPI 스냅샷 건수가 기존 활성 데이터 대비 급감했습니다. staged=${stats.staged}, currentSourceActive=${stats.currentSourceActive}`
    );
  }

  await options.beforeApply?.();
  await applyCultureSnapshot(d1, stagingRunKey);
  await cleanupCultureSyncStagingRun(d1, stagingRunKey);

  return {
    inserted: Math.max(stats.staged - stats.matched, 0),
    updated: stats.updated,
    reactivated: stats.reactivated,
    deactivated: stats.deactivated,
    staged: stats.staged,
    skipped: insertStats.skipped,
  };
};
