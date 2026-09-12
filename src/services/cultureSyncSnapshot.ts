import { TOUR_API_SOURCE_KEY_PREFIX } from './cultureIdentity';
import {
  D1Binding,
  INACTIVE_RETENTION_DAYS,
  STAGING_COLUMNS,
  STAGING_TABLE,
  toCount,
} from './cultureSyncTypes';
import { STAGING_RUN_KEY_COLUMN } from './cultureSyncStaging';

const LEGACY_SOURCE_CONDITION = `(source_key IS NULL OR source_key NOT LIKE '${TOUR_API_SOURCE_KEY_PREFIX}%')`;
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

export const readCultureSnapshotStats = async (d1: D1Binding, stagingRunKey: string) => {
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
            AND live.source_key LIKE '${TOUR_API_SOURCE_KEY_PREFIX}%'
            AND live.missing_snapshot_count >= 1
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

export const applyCultureSnapshot = async (d1: D1Binding, stagingRunKey: string) => {
  const contentDiffers = createCultureContentDifferenceSql();
  const updateLive = d1.prepare(`
    UPDATE cultures AS live
    SET (${LIVE_MUTABLE_COLUMNS.join(', ')}, is_active, last_seen_at, missing_snapshot_count, deactivated_at, updated_at) = (
      SELECT ${LIVE_MUTABLE_COLUMNS.map(column => `staging.${column}`).join(', ')},
        1,
        CURRENT_TIMESTAMP,
        0,
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
        OR live.missing_snapshot_count <> 0
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
      ${STAGING_COLUMNS.join(', ')}, is_active, last_seen_at, missing_snapshot_count, deactivated_at, created_at, updated_at
    )
    SELECT
      ${STAGING_COLUMNS.map(column => `staging.${column}`).join(', ')},
      1,
      CURRENT_TIMESTAMP,
      0,
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
    SET missing_snapshot_count = missing_snapshot_count + 1,
        is_active = CASE WHEN missing_snapshot_count + 1 >= 2 THEN 0 ELSE 1 END,
        deactivated_at = CASE WHEN missing_snapshot_count + 1 >= 2 THEN CURRENT_TIMESTAMP ELSE deactivated_at END,
        updated_at = CURRENT_TIMESTAMP
    WHERE is_active = 1
      AND source_key LIKE '${TOUR_API_SOURCE_KEY_PREFIX}%'
      AND NOT EXISTS (
        SELECT 1 FROM ${STAGING_TABLE} AS staging
        WHERE staging.source_key = live.source_key
          AND staging.${STAGING_RUN_KEY_COLUMN} = ?1
      )
  `).bind(stagingRunKey);
  const deactivateLegacySources = d1.prepare(`
    UPDATE cultures
    SET is_active = 0,
        deactivated_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE is_active = 1
      AND ${LEGACY_SOURCE_CONDITION}
  `);
  const removeExpiredInactive = d1.prepare(`
    DELETE FROM cultures
    WHERE is_active = 0
      AND datetime(deactivated_at) < datetime('now', '-${INACTIVE_RETENTION_DAYS} days')
  `);
  const removeLegacySources = d1.prepare(`
    DELETE FROM cultures
    WHERE is_active = 0
      AND ${LEGACY_SOURCE_CONDITION}
  `);

  await d1.batch([
    updateLive,
    insertNew,
    deactivateMissing,
    deactivateLegacySources,
    removeLegacySources,
    removeExpiredInactive,
  ]);
};
