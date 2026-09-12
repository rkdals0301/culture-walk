import { CULTURE_CONTENT_SELECT } from '@/services/cultureD1Repository';
import type { CultureContentRow } from '@/services/cultureService';
import { serializeTourApiDetails, createTourApiDetailSummary } from '@/services/tourApiDetails';
import type { TourApiFestivalDetails } from '@/types/culture';

import type { D1Binding } from './cultureSyncTypes';

const STALE_DETAIL_REFRESH_LIMIT = 12;
const DETAIL_REFRESH_REQUEST_COOLDOWN_MINUTES = 5;

export type StaleDetailRow = CultureContentRow & { detailSyncFailCount?: number | null };

export const requestCultureDetailRefresh = async (d1: D1Binding, sourceKey: string) => {
  await d1
    .prepare(
      `UPDATE cultures
       SET detail_refresh_requested_at = CURRENT_TIMESTAMP,
           detail_refresh_priority = 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE source_key = ?
         AND is_active = 1
         AND (detail_next_retry_at IS NULL OR detail_next_retry_at <= CURRENT_TIMESTAMP)
         AND (
           detail_refresh_requested_at IS NULL
           OR datetime(detail_refresh_requested_at) <= datetime('now', '-${DETAIL_REFRESH_REQUEST_COOLDOWN_MINUTES} minutes')
         )`
    )
    .bind(sourceKey)
    .run();
};

export const hasStaleCachedTourApiDetails = async (d1: D1Binding) => {
  const result = await d1
    .prepare(
      `SELECT 1 AS pending
       FROM cultures
       LEFT JOIN culture_tour_api_details details ON details.source_key = cultures.source_key
       WHERE cultures.is_active = 1
         AND cultures.source_key LIKE 'tourapi:%'
         AND (cultures.detail_next_retry_at IS NULL OR cultures.detail_next_retry_at <= CURRENT_TIMESTAMP)
         AND (
           cultures.detail_refresh_requested_at IS NOT NULL
           OR details.source_key IS NULL
           OR details.is_complete != 1
           OR details.source_modified_at IS NOT cultures.registration_date
         )
       LIMIT 1`
    )
    .all();

  return (result.results?.length ?? 0) > 0;
};

export const readStaleCultureDetailRows = async (d1: D1Binding): Promise<StaleDetailRow[]> => {
  const result = await d1
    .prepare(
      `SELECT ${CULTURE_CONTENT_SELECT}, cultures.detail_sync_fail_count AS "detailSyncFailCount"
       FROM cultures
       LEFT JOIN culture_tour_api_details details ON details.source_key = cultures.source_key
       WHERE cultures.is_active = 1
         AND cultures.source_key LIKE 'tourapi:%'
         AND (cultures.detail_next_retry_at IS NULL OR cultures.detail_next_retry_at <= CURRENT_TIMESTAMP)
         AND (
           cultures.detail_refresh_requested_at IS NOT NULL
           OR details.source_key IS NULL
           OR details.is_complete != 1
           OR details.source_modified_at IS NOT cultures.registration_date
         )
       ORDER BY cultures.detail_refresh_priority DESC,
                cultures.detail_refresh_requested_at ASC,
                details.synced_at ASC
       LIMIT ?`
    )
    .bind(STALE_DETAIL_REFRESH_LIMIT)
    .all();

  return (result.results ?? []) as StaleDetailRow[];
};

export const persistCultureDetailRefreshSuccess = async (
  d1: D1Binding,
  row: StaleDetailRow,
  details: TourApiFestivalDetails,
  syncedAt: string,
) => {
  const cultureId = Number(row.id);
  const sourceKey = row.sourceKey;
  const serialized = serializeTourApiDetails(details);
  const summary = createTourApiDetailSummary(details);

  await d1.batch([
    d1
      .prepare(
        `INSERT INTO culture_tour_api_details (
          source_key, source_modified_at, common_json, intro_json, info_json, images_json, is_complete, synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(source_key) DO UPDATE SET
          source_modified_at = excluded.source_modified_at,
          common_json = excluded.common_json,
          intro_json = excluded.intro_json,
          info_json = excluded.info_json,
          images_json = excluded.images_json,
          is_complete = excluded.is_complete,
          synced_at = excluded.synced_at`
      )
      .bind(
        sourceKey,
        row.registrationDate ?? null,
        serialized.commonJson,
        serialized.introJson,
        serialized.infoJson,
        serialized.imagesJson,
        serialized.isComplete ? 1 : 0,
        syncedAt
      ),
    d1
      .prepare(
        `UPDATE cultures SET
          homepage_detail_address = ?,
          is_free = ?,
          homepage_address = ?,
          organization_name = ?,
          performer_information = ?,
          program_introduction = ?,
          use_fee = ?,
          use_target = ?,
          detail_refresh_requested_at = NULL,
          detail_refresh_priority = 0,
          detail_sync_fail_count = 0,
          detail_next_retry_at = NULL,
          detail_last_error = NULL,
          updated_at = ?
        WHERE id = ?`
      )
      .bind(
        summary.homepageDetailAddress,
        summary.isFree,
        summary.homepageAddress,
        summary.organizationName,
        summary.performerInformation,
        summary.programIntroduction,
        summary.useFee,
        summary.useTarget,
        syncedAt,
        cultureId
      ),
  ]);
};

export const persistCultureDetailRefreshFailure = async (
  d1: D1Binding,
  sourceKey: string,
  failCount: number,
  retryAt: string,
  message: string,
) => {
  await d1
    .prepare(
      `UPDATE cultures
       SET detail_sync_fail_count = ?, detail_next_retry_at = ?, detail_last_error = ?, updated_at = CURRENT_TIMESTAMP
       WHERE source_key = ?`
    )
    .bind(failCount, retryAt, message.slice(0, 1000), sourceKey)
    .run();
};
