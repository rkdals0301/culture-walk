import { NewCultureRow } from '@/db/schema';

import { TOUR_API_SOURCE_KEY_PREFIX } from './cultureIdentity';

import {
  BATCH_SIZE,
  D1Binding,
  INACTIVE_RETENTION_DAYS,
  InsertStats,
  MAX_SKIPPED_ROW_RATIO,
  MIN_SNAPSHOT_EXISTING_RATIO,
  MIN_VALID_COORDINATE_COUNT,
  RETRY_LIMIT,
  STAGING_COLUMNS,
  STAGING_STATEMENTS_PER_BATCH,
  STAGING_TABLE,
  SnapshotStats,
  toStagingValues,
} from './cultureSyncTypes';

const createStagingTableSql = `
  CREATE TABLE IF NOT EXISTS ${STAGING_TABLE} (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    sync_run_key TEXT NOT NULL,
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

const STAGING_RUN_KEY_COLUMN = 'sync_run_key';
const STAGING_INSERT_COLUMNS = [STAGING_RUN_KEY_COLUMN, ...STAGING_COLUMNS];
const DETAIL_ENRICHED_COLUMNS = new Set([
  'homepage_detail_address',
  'is_free',
  'homepage_address',
  'organization_name',
  'performer_information',
  'program_introduction',
  'use_fee',
  'use_target',
]);
const LIVE_MUTABLE_COLUMNS = STAGING_COLUMNS.filter(
  column => column !== 'source_key' && !DETAIL_ENRICHED_COLUMNS.has(column)
);

export const createCultureContentDifferenceSql = (liveAlias = 'live', stagingAlias = 'staging') =>
  LIVE_MUTABLE_COLUMNS.map(column => `${liveAlias}.${column} IS NOT ${stagingAlias}.${column}`).join(' OR ');

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
  stagingRunKey: string,
  retries: number
): Promise<InsertStats> => {
  const jsonRows = JSON.stringify(batch.map(row => [stagingRunKey, ...toStagingValues(row)]));
  const jsonColumns = STAGING_INSERT_COLUMNS.map((_, index) => `json_extract(value, '$[${index}]')`).join(
    ', '
  );

  try {
    await d1
      .prepare(
        `INSERT INTO ${STAGING_TABLE} (${STAGING_INSERT_COLUMNS.join(', ')})
         SELECT ${jsonColumns} FROM json_each(?)`
      )
      .bind(jsonRows)
      .run();

    return { inserted: batch.length, skipped: 0 };
  } catch (error) {
    if (retries > 0) {
      console.warn(`staging insert 재시도. 남은 횟수: ${retries}`, error);
      return retryInsertStagingBatch(d1, batch, stagingRunKey, retries - 1);
    }

    if (batch.length > 1) {
      const mid = Math.floor(batch.length / 2);
      const leftStats = await retryInsertStagingBatch(d1, batch.slice(0, mid), stagingRunKey, RETRY_LIMIT);
      const rightStats = await retryInsertStagingBatch(d1, batch.slice(mid), stagingRunKey, RETRY_LIMIT);

      return {
        inserted: leftStats.inserted + rightStats.inserted,
        skipped: leftStats.skipped + rightStats.skipped,
      };
    }

    console.error(`단일 문화 데이터 staging insert 실패로 스킵합니다. title=${batch[0]?.title ?? 'unknown'}`, error);
    return { inserted: 0, skipped: 1 };
  }
};

const retryInsertStagingStatementGroup = async (
  d1: D1Binding,
  batches: NewCultureRow[][],
  stagingRunKey: string,
  retries: number
): Promise<InsertStats> => {
  const jsonColumns = STAGING_INSERT_COLUMNS.map((_, index) => `json_extract(value, '$[${index}]')`).join(', ');
  const query = `INSERT INTO ${STAGING_TABLE} (${STAGING_INSERT_COLUMNS.join(', ')})
                 SELECT ${jsonColumns} FROM json_each(?)`;

  try {
    await d1.batch(
      batches.map(batch =>
        d1.prepare(query).bind(JSON.stringify(batch.map(row => [stagingRunKey, ...toStagingValues(row)])))
      )
    );

    return {
      inserted: batches.reduce((total, batch) => total + batch.length, 0),
      skipped: 0,
    };
  } catch (error) {
    if (retries > 0) {
      console.warn(`staging statement batch 재시도. 남은 횟수: ${retries}`, error);
      return retryInsertStagingStatementGroup(d1, batches, stagingRunKey, retries - 1);
    }

    if (batches.length > 1) {
      const mid = Math.floor(batches.length / 2);
      const leftStats = await retryInsertStagingStatementGroup(
        d1,
        batches.slice(0, mid),
        stagingRunKey,
        RETRY_LIMIT
      );
      const rightStats = await retryInsertStagingStatementGroup(
        d1,
        batches.slice(mid),
        stagingRunKey,
        RETRY_LIMIT
      );

      return {
        inserted: leftStats.inserted + rightStats.inserted,
        skipped: leftStats.skipped + rightStats.skipped,
      };
    }

    return retryInsertStagingBatch(d1, batches[0], stagingRunKey, RETRY_LIMIT);
  }
};

const readSnapshotStats = async (d1: D1Binding, stagingRunKey: string) => {
  const contentDiffers = createCultureContentDifferenceSql();
  const result = await d1
    .prepare(
      `WITH scoped_staging AS (
        SELECT * FROM ${STAGING_TABLE} WHERE ${STAGING_RUN_KEY_COLUMN} = ?
      )
      SELECT
        (SELECT COUNT(*) FROM scoped_staging) AS staged,
        (SELECT COUNT(*) FROM cultures
          WHERE is_active = 1 AND source_key LIKE '${TOUR_API_SOURCE_KEY_PREFIX}%') AS current_source_active,
        (SELECT COUNT(*) FROM scoped_staging staging
          INNER JOIN cultures live ON live.source_key = staging.source_key) AS matched,
        (SELECT COUNT(*) FROM scoped_staging staging
          INNER JOIN cultures live ON live.source_key = staging.source_key
          WHERE live.is_active = 1
            AND (${contentDiffers})) AS updated,
        (SELECT COUNT(*) FROM scoped_staging staging
          INNER JOIN cultures live ON live.source_key = staging.source_key
          WHERE live.is_active = 0) AS reactivated,
        (SELECT COUNT(*) FROM cultures live
          WHERE live.is_active = 1
            AND NOT EXISTS (
              SELECT 1 FROM scoped_staging staging WHERE staging.source_key = live.source_key
            )) AS deactivated`
    )
    .bind(stagingRunKey)
    .all();

  const row = result.results?.[0];
  return {
    staged: toCount(row?.staged),
    currentSourceActive: toCount(row?.current_source_active),
    matched: toCount(row?.matched),
    updated: toCount(row?.updated),
    reactivated: toCount(row?.reactivated),
    deactivated: toCount(row?.deactivated),
  };
};

const applySnapshot = async (d1: D1Binding, stagingRunKey: string) => {
  const contentDiffers = createCultureContentDifferenceSql();
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
        AND staging.${STAGING_RUN_KEY_COLUMN} = ?1
    )
    WHERE EXISTS (
      SELECT 1 FROM ${STAGING_TABLE} AS staging
      WHERE staging.source_key = live.source_key
        AND staging.${STAGING_RUN_KEY_COLUMN} = ?1
    )
      AND (
        live.is_active = 0
        OR EXISTS (
          SELECT 1
          FROM ${STAGING_TABLE} AS staging
          WHERE staging.source_key = live.source_key
            AND staging.${STAGING_RUN_KEY_COLUMN} = ?1
            AND (${contentDiffers})
        )
      )
  `).bind(stagingRunKey);
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
    WHERE staging.${STAGING_RUN_KEY_COLUMN} = ?1
      AND NOT EXISTS (
      SELECT 1 FROM cultures AS live WHERE live.source_key = staging.source_key
    )
  `).bind(stagingRunKey);
  const deactivateMissing = d1.prepare(`
    UPDATE cultures AS live
    SET is_active = 0,
        deactivated_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE is_active = 1
      AND NOT EXISTS (
        SELECT 1 FROM ${STAGING_TABLE} AS staging
        WHERE staging.source_key = live.source_key
          AND staging.${STAGING_RUN_KEY_COLUMN} = ?1
      )
  `).bind(stagingRunKey);
  const removeExpiredInactive = d1.prepare(`
    DELETE FROM cultures
    WHERE is_active = 0
      AND datetime(deactivated_at) < datetime('now', '-${INACTIVE_RETENTION_DAYS} days')
  `);
  const removeLegacySources = d1.prepare(`
    DELETE FROM cultures
    WHERE is_active = 0
      AND (source_key IS NULL OR source_key NOT LIKE '${TOUR_API_SOURCE_KEY_PREFIX}%')
  `);

  await d1.batch([updateLive, insertNew, deactivateMissing, removeLegacySources, removeExpiredInactive]);
};

export const reconcileCulturesViaStaging = async (
  d1: D1Binding,
  rows: NewCultureRow[],
  stagingRunKey: string
): Promise<SnapshotStats> => {
  await ensureCultureSyncStagingTable(d1);
  await d1
    .prepare(
      `DELETE FROM ${STAGING_TABLE}
       WHERE ${STAGING_RUN_KEY_COLUMN} = ?
          OR datetime(created_at) < datetime('now', '-1 day')`
    )
    .bind(stagingRunKey)
    .run();

  let insertStats: InsertStats = { inserted: 0, skipped: 0 };
  const batches: NewCultureRow[][] = [];

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    batches.push(rows.slice(i, i + BATCH_SIZE));
  }

  for (let i = 0; i < batches.length; i += STAGING_STATEMENTS_PER_BATCH) {
    const stats = await retryInsertStagingStatementGroup(
      d1,
      batches.slice(i, i + STAGING_STATEMENTS_PER_BATCH),
      stagingRunKey,
      RETRY_LIMIT
    );
    insertStats = {
      inserted: insertStats.inserted + stats.inserted,
      skipped: insertStats.skipped + stats.skipped,
    };
  }

  const skippedRatio = insertStats.skipped / rows.length;
  console.info(
    `staging insert 완료: inserted=${insertStats.inserted}, skipped=${insertStats.skipped}, total=${rows.length}`
  );

  if (insertStats.inserted < MIN_VALID_COORDINATE_COUNT || skippedRatio > MAX_SKIPPED_ROW_RATIO) {
    throw new Error(
      `staging insert 결과가 비정상입니다. inserted=${insertStats.inserted}, skipped=${insertStats.skipped}, total=${rows.length}`
    );
  }

  const stats = await readSnapshotStats(d1, stagingRunKey);
  if (
    stats.currentSourceActive >= MIN_VALID_COORDINATE_COUNT &&
    stats.staged / stats.currentSourceActive < MIN_SNAPSHOT_EXISTING_RATIO
  ) {
    throw new Error(
      `TourAPI 스냅샷 건수가 기존 활성 데이터 대비 급감했습니다. staged=${stats.staged}, currentSourceActive=${stats.currentSourceActive}`
    );
  }

  await applySnapshot(d1, stagingRunKey);

  try {
    await d1
      .prepare(`DELETE FROM ${STAGING_TABLE} WHERE ${STAGING_RUN_KEY_COLUMN} = ?`)
      .bind(stagingRunKey)
      .run();
  } catch (error) {
    console.warn('반영 완료 후 staging 정리에 실패했습니다.', error);
  }

  return {
    inserted: Math.max(stats.staged - stats.matched, 0),
    updated: stats.updated,
    reactivated: stats.reactivated,
    deactivated: stats.deactivated,
    staged: stats.staged,
    skipped: insertStats.skipped,
  };
};
