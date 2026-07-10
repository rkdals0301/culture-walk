import { NewCultureRow } from '@/db/schema';

import {
  BATCH_SIZE,
  D1Binding,
  INACTIVE_RETENTION_DAYS,
  InsertStats,
  MAX_SKIPPED_ROW_RATIO,
  MIN_SNAPSHOT_EXISTING_RATIO,
  MIN_VALID_COORDINATE_COUNT,
  RETRY_LIMIT,
  SnapshotStats,
  STAGING_COLUMNS,
  STAGING_TABLE,
  toStagingValues,
} from './cultureSyncTypes';

const createStagingTableSql = `
  CREATE TABLE IF NOT EXISTS ${STAGING_TABLE} (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    source_key TEXT NOT NULL,
    classification TEXT,
    date TEXT,
    end_date TEXT,
    etc_description TEXT,
    gu_name TEXT,
    homepage_detail_address TEXT,
    is_free TEXT,
    lat REAL,
    lng REAL,
    main_image TEXT,
    homepage_address TEXT,
    organization_name TEXT,
    place TEXT,
    performer_information TEXT,
    program_introduction TEXT,
    registration_date TEXT,
    start_date TEXT,
    theme_classification TEXT,
    register TEXT,
    title TEXT,
    use_fee TEXT,
    use_target TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
  )
`;

const LIVE_MUTABLE_COLUMNS = STAGING_COLUMNS.filter(column => column !== 'source_key');

const toCount = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const ensureCultureSyncStagingTable = async (d1: D1Binding) => {
  await d1.prepare(createStagingTableSql).run();
};

const retryInsertStagingBatch = async (
  d1: D1Binding,
  batch: NewCultureRow[],
  retries: number
): Promise<InsertStats> => {
  const jsonRows = JSON.stringify(batch.map(toStagingValues));
  const jsonColumns = STAGING_COLUMNS.map((_, index) => `json_extract(value, '$[${index}]')`).join(', ');

  try {
    await d1
      .prepare(
        `INSERT INTO ${STAGING_TABLE} (${STAGING_COLUMNS.join(', ')})
         SELECT ${jsonColumns} FROM json_each(?)`
      )
      .bind(jsonRows)
      .run();

    return { inserted: batch.length, skipped: 0 };
  } catch (error) {
    if (retries > 0) {
      console.warn(`staging insert 재시도. 남은 횟수: ${retries}`, error);
      return retryInsertStagingBatch(d1, batch, retries - 1);
    }

    if (batch.length > 1) {
      const mid = Math.floor(batch.length / 2);
      const leftStats = await retryInsertStagingBatch(d1, batch.slice(0, mid), RETRY_LIMIT);
      const rightStats = await retryInsertStagingBatch(d1, batch.slice(mid), RETRY_LIMIT);

      return {
        inserted: leftStats.inserted + rightStats.inserted,
        skipped: leftStats.skipped + rightStats.skipped,
      };
    }

    console.error(`단일 문화 데이터 staging insert 실패로 스킵합니다. title=${batch[0]?.title ?? 'unknown'}`, error);
    return { inserted: 0, skipped: 1 };
  }
};

const readSnapshotStats = async (d1: D1Binding) => {
  const result = await d1
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM ${STAGING_TABLE}) AS staged,
        (SELECT COUNT(*) FROM cultures WHERE is_active = 1) AS current_active,
        (SELECT COUNT(*) FROM ${STAGING_TABLE} staging
          INNER JOIN cultures live ON live.source_key = staging.source_key) AS matched,
        (SELECT COUNT(*) FROM ${STAGING_TABLE} staging
          INNER JOIN cultures live ON live.source_key = staging.source_key
          WHERE live.is_active = 0) AS reactivated,
        (SELECT COUNT(*) FROM cultures live
          WHERE live.is_active = 1
            AND NOT EXISTS (
              SELECT 1 FROM ${STAGING_TABLE} staging WHERE staging.source_key = live.source_key
            )) AS deactivated`
    )
    .all();

  const row = result.results?.[0];
  return {
    staged: toCount(row?.staged),
    currentActive: toCount(row?.current_active),
    matched: toCount(row?.matched),
    reactivated: toCount(row?.reactivated),
    deactivated: toCount(row?.deactivated),
  };
};

const applySnapshot = async (d1: D1Binding) => {
  const updateLive = d1.prepare(`
    UPDATE cultures AS live
    SET (${LIVE_MUTABLE_COLUMNS.join(', ')}, is_active, last_seen_at, deactivated_at, updated_at) = (
      SELECT ${LIVE_MUTABLE_COLUMNS.map(column => `staging.${column}`).join(', ')},
        1,
        CURRENT_TIMESTAMP,
        NULL,
        CURRENT_TIMESTAMP
      FROM ${STAGING_TABLE} AS staging
      WHERE staging.source_key = live.source_key
    )
    WHERE EXISTS (
      SELECT 1 FROM ${STAGING_TABLE} AS staging WHERE staging.source_key = live.source_key
    )
  `);
  const insertNew = d1.prepare(`
    INSERT INTO cultures (
      ${STAGING_COLUMNS.join(', ')}, is_active, last_seen_at, deactivated_at, created_at, updated_at
    )
    SELECT
      ${STAGING_COLUMNS.map(column => `staging.${column}`).join(', ')},
      1,
      CURRENT_TIMESTAMP,
      NULL,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    FROM ${STAGING_TABLE} AS staging
    WHERE NOT EXISTS (
      SELECT 1 FROM cultures AS live WHERE live.source_key = staging.source_key
    )
  `);
  const deactivateMissing = d1.prepare(`
    UPDATE cultures AS live
    SET is_active = 0,
        deactivated_at = COALESCE(deactivated_at, CURRENT_TIMESTAMP),
        updated_at = CURRENT_TIMESTAMP
    WHERE is_active = 1
      AND NOT EXISTS (
        SELECT 1 FROM ${STAGING_TABLE} AS staging WHERE staging.source_key = live.source_key
      )
  `);
  const removeExpiredInactive = d1.prepare(`
    DELETE FROM cultures
    WHERE is_active = 0
      AND datetime(deactivated_at) < datetime('now', '-${INACTIVE_RETENTION_DAYS} days')
  `);

  await d1.batch([updateLive, insertNew, deactivateMissing, removeExpiredInactive]);
};

export const reconcileCulturesViaStaging = async (d1: D1Binding, rows: NewCultureRow[]): Promise<SnapshotStats> => {
  await ensureCultureSyncStagingTable(d1);
  await d1.prepare(`DELETE FROM ${STAGING_TABLE}`).run();

  let insertStats: InsertStats = { inserted: 0, skipped: 0 };

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const stats = await retryInsertStagingBatch(d1, rows.slice(i, i + BATCH_SIZE), RETRY_LIMIT);
    insertStats = {
      inserted: insertStats.inserted + stats.inserted,
      skipped: insertStats.skipped + stats.skipped,
    };
  }

  const skippedRatio = insertStats.skipped / rows.length;
  console.info(`staging insert 완료: inserted=${insertStats.inserted}, skipped=${insertStats.skipped}, total=${rows.length}`);

  if (insertStats.inserted < MIN_VALID_COORDINATE_COUNT || skippedRatio > MAX_SKIPPED_ROW_RATIO) {
    throw new Error(
      `staging insert 결과가 비정상입니다. inserted=${insertStats.inserted}, skipped=${insertStats.skipped}, total=${rows.length}`
    );
  }

  const stats = await readSnapshotStats(d1);
  if (
    stats.currentActive >= MIN_VALID_COORDINATE_COUNT &&
    stats.staged / stats.currentActive < MIN_SNAPSHOT_EXISTING_RATIO
  ) {
    throw new Error(
      `스냅샷 건수가 기존 활성 데이터 대비 급감했습니다. staged=${stats.staged}, currentActive=${stats.currentActive}`
    );
  }

  await applySnapshot(d1);

  try {
    await d1.prepare(`DELETE FROM ${STAGING_TABLE}`).run();
  } catch (error) {
    console.warn('반영 완료 후 staging 정리에 실패했습니다.', error);
  }

  return {
    inserted: Math.max(stats.staged - stats.matched, 0),
    updated: stats.matched,
    reactivated: stats.reactivated,
    deactivated: stats.deactivated,
    staged: stats.staged,
    skipped: insertStats.skipped,
  };
};
