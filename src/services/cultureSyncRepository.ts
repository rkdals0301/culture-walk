import { NewCultureRow } from '@/db/schema';

import {
  BATCH_SIZE,
  D1Binding,
  InsertStats,
  MAX_SKIPPED_ROW_RATIO,
  MIN_VALID_COORDINATE_COUNT,
  RETRY_LIMIT,
  STAGING_COLUMNS,
  STAGING_TABLE,
  toStagingValues,
} from './cultureSyncTypes';

const createStagingTableSql = `
  CREATE TABLE IF NOT EXISTS ${STAGING_TABLE} (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
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

export const ensureCultureSyncStagingTable = async (d1: D1Binding) => {
  await d1.prepare(createStagingTableSql).run();
};

const retryInsertStagingBatch = async (
  d1: D1Binding,
  batch: NewCultureRow[],
  retries: number
): Promise<InsertStats> => {
  const placeholders = batch.map(() => `(${STAGING_COLUMNS.map(() => '?').join(', ')})`).join(', ');
  const values = batch.flatMap(toStagingValues);

  try {
    await d1
      .prepare(`INSERT INTO ${STAGING_TABLE} (${STAGING_COLUMNS.join(', ')}) VALUES ${placeholders}`)
      .bind(...values)
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

export const replaceCulturesViaStaging = async (d1: D1Binding, rows: NewCultureRow[]) => {
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

  const deleteLive = d1.prepare('DELETE FROM cultures');
  const insertLive = d1.prepare(`
    INSERT INTO cultures (${STAGING_COLUMNS.join(', ')}, created_at, updated_at)
    SELECT ${STAGING_COLUMNS.join(', ')}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM ${STAGING_TABLE}
  `);

  if (d1.batch) {
    await d1.batch([deleteLive, insertLive]);
  } else {
    await deleteLive.run();
    await insertLive.run();
  }

  await d1.prepare(`DELETE FROM ${STAGING_TABLE}`).run();

  return insertStats;
};
