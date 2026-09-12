import { NewCultureRow } from '@/db/schema';

import {
  BATCH_SIZE,
  D1Binding,
  INITIALIZE_LOCK_LEASE_LOST_MESSAGE,
  InsertStats,
  RETRY_LIMIT,
  STAGING_COLUMNS,
  STAGING_STATEMENTS_PER_BATCH,
  STAGING_TABLE,
  toStagingValues,
} from './cultureSyncTypes';

export const STAGING_RUN_KEY_COLUMN = 'sync_run_key';
const STAGING_INSERT_COLUMNS = [STAGING_RUN_KEY_COLUMN, ...STAGING_COLUMNS];

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

export const ensureCultureSyncStagingTable = async (d1: D1Binding) => {
  await d1.prepare(createStagingTableSql).run();
};

export const clearCultureSyncStagingRows = async (d1: D1Binding, stagingRunKey: string) => {
  await d1
    .prepare(
      `DELETE FROM ${STAGING_TABLE}
       WHERE ${STAGING_RUN_KEY_COLUMN} = ?
          OR datetime(created_at) < datetime('now', '-1 day')`
    )
    .bind(stagingRunKey)
    .run();
};

const retryInsertStagingBatch = async (
  d1: D1Binding,
  batch: NewCultureRow[],
  stagingRunKey: string,
  retries: number
): Promise<InsertStats> => {
  const jsonRows = JSON.stringify(batch.map(row => [stagingRunKey, ...toStagingValues(row)]));
  const jsonColumns = STAGING_INSERT_COLUMNS.map((_, index) => `json_extract(value, '$[${index}]')`).join(', ');

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
      const leftStats = await retryInsertStagingStatementGroup(d1, batches.slice(0, mid), stagingRunKey, RETRY_LIMIT);
      const rightStats = await retryInsertStagingStatementGroup(d1, batches.slice(mid), stagingRunKey, RETRY_LIMIT);
      return {
        inserted: leftStats.inserted + rightStats.inserted,
        skipped: leftStats.skipped + rightStats.skipped,
      };
    }

    return retryInsertStagingBatch(d1, batches[0], stagingRunKey, RETRY_LIMIT);
  }
};

export const stageCultureRows = async (
  d1: D1Binding,
  rows: NewCultureRow[],
  stagingRunKey: string,
  beforeEach?: () => Promise<boolean>
) => {
  let insertStats: InsertStats = { inserted: 0, skipped: 0 };
  const batches: NewCultureRow[][] = [];
  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    batches.push(rows.slice(index, index + BATCH_SIZE));
  }

  for (let index = 0; index < batches.length; index += STAGING_STATEMENTS_PER_BATCH) {
    if (beforeEach && !(await beforeEach())) {
      throw new Error(INITIALIZE_LOCK_LEASE_LOST_MESSAGE);
    }
    const stats = await retryInsertStagingStatementGroup(
      d1,
      batches.slice(index, index + STAGING_STATEMENTS_PER_BATCH),
      stagingRunKey,
      RETRY_LIMIT
    );
    insertStats = {
      inserted: insertStats.inserted + stats.inserted,
      skipped: insertStats.skipped + stats.skipped,
    };
  }

  return insertStats;
};

export const cleanupCultureSyncStagingRun = async (d1: D1Binding, stagingRunKey: string) => {
  try {
    await d1
      .prepare(`DELETE FROM ${STAGING_TABLE} WHERE ${STAGING_RUN_KEY_COLUMN} = ?`)
      .bind(stagingRunKey)
      .run();
  } catch (error) {
    console.warn('반영 완료 후 staging 정리에 실패했습니다.', error);
  }
};
