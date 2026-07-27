import { createTourApiDetailSummary, serializeTourApiDetails } from '@/services/tourApiDetails';

import { getTourApiContentId } from './cultureIdentity';
import { fetchTourApiFestivalDetails } from './cultureSyncSource';
import { D1Binding, TourApiConfig } from './cultureSyncTypes';

const STALE_DETAIL_REFRESH_LIMIT = 12;

type StaleDetailRow = {
  culture_id?: number;
  source_key?: string;
  registration_date?: string | null;
};

const refreshCachedDetail = async (config: TourApiConfig, d1: D1Binding, row: StaleDetailRow) => {
  const cultureId = Number(row.culture_id);
  const sourceKey = row.source_key;
  const contentId = getTourApiContentId(sourceKey);

  if (!Number.isInteger(cultureId) || !sourceKey || !contentId) return false;

  const details = await fetchTourApiFestivalDetails(config, contentId);
  const serialized = serializeTourApiDetails(details);
  const summary = createTourApiDetailSummary(details);
  const syncedAt = new Date().toISOString();

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
        row.registration_date ?? null,
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

  return true;
};

export const refreshStaleCachedTourApiDetails = async (config: TourApiConfig, d1: D1Binding) => {
  const result = await d1
    .prepare(
      `SELECT cultures.id AS culture_id, cultures.source_key, cultures.registration_date
       FROM cultures
       INNER JOIN culture_tour_api_details details ON details.source_key = cultures.source_key
       WHERE cultures.is_active = 1
         AND cultures.source_key LIKE 'tourapi:%'
         AND (details.is_complete != 1 OR details.source_modified_at IS NOT cultures.registration_date)
       ORDER BY details.synced_at DESC
       LIMIT ?`
    )
    .bind(STALE_DETAIL_REFRESH_LIMIT)
    .all();

  let refreshed = 0;
  for (const row of result.results ?? []) {
    try {
      refreshed += (await refreshCachedDetail(config, d1, row as StaleDetailRow)) ? 1 : 0;
    } catch (error) {
      console.warn(`TourAPI 상세 캐시 보강을 건너뜁니다. sourceKey=${String(row.source_key ?? 'unknown')}`, error);
    }
  }

  return refreshed;
};
