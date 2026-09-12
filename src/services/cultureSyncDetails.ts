import {
  type CultureCacheBinding,
  readCultureDetailCache,
  readCultureReadModelCache,
  writeCultureDetailCache,
} from '@/cache/kv';
import { CULTURE_CONTENT_SELECT, CULTURE_DETAIL_SELECT, toCultureTourApiDetailsRow } from '@/services/cultureD1Repository';
import { type CultureContentRow, mapCultureRowToCulture } from '@/services/cultureService';
import {
  createTourApiDetailSummary,
  parseStoredTourApiDetails,
  serializeTourApiDetails,
} from '@/services/tourApiDetails';
import { getKoreaDateStartIso } from '@/utils/dateUtils';

import { getTourApiContentId } from './cultureIdentity';
import { fetchTourApiFestivalDetails } from './cultureSyncSource';
import { D1Binding, INITIALIZE_LOCK_LEASE_LOST_MESSAGE, TourApiConfig } from './cultureSyncTypes';

const STALE_DETAIL_REFRESH_LIMIT = 12;
const DETAIL_REFRESH_REQUEST_COOLDOWN_MINUTES = 5;
const DETAIL_READ_MODEL_TTL_SECONDS = 60 * 60 * 24 * 7;
const DETAIL_READ_MODEL_WRITE_BATCH_SIZE = 25;

type StaleDetailRow = CultureContentRow & { detailSyncFailCount?: number | null };

const retryDelayMinutes = (failCount: number, sourceKey: string) => {
  const base = failCount <= 1 ? 10 : failCount === 2 ? 30 : Math.min(120 * 2 ** (failCount - 3), 24 * 60);
  let hash = 0;
  for (let index = 0; index < sourceKey.length; index += 1) hash = (hash * 31 + sourceKey.charCodeAt(index)) | 0;
  return Math.min(24 * 60, Math.max(1, Math.round(base * (0.9 + (Math.abs(hash) % 21) / 100))));
};

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

const refreshCachedDetail = async (
  config: TourApiConfig,
  d1: D1Binding,
  row: StaleDetailRow,
  beforeWrite?: () => Promise<boolean>,
  cache?: CultureCacheBinding,
  cacheVersion = 'detail-refresh',
) => {
  const cultureId = Number(row.id);
  const sourceKey = row.sourceKey;
  const contentId = getTourApiContentId(sourceKey);

  if (!Number.isInteger(cultureId) || !sourceKey || !contentId) return false;

  const details = await fetchTourApiFestivalDetails(config, contentId);
  if (!details.complete) {
    throw new Error(`TourAPI 상세정보 일부 조회로 저장하지 않습니다. sourceKey=${sourceKey}`);
  }

  if (beforeWrite && !(await beforeWrite())) {
    throw new Error(INITIALIZE_LOCK_LEASE_LOST_MESSAGE);
  }

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

  if (cache) {
    const culture = mapCultureRowToCulture({ ...row, updatedAt: syncedAt }, details);
    await writeCultureDetailCache(cultureId, cacheVersion, culture, DETAIL_READ_MODEL_TTL_SECONDS, cache);
  }

  return true;
};

export const refreshStaleCachedTourApiDetails = async (
  config: TourApiConfig,
  d1: D1Binding,
  options: {
    beforeEach?: () => Promise<boolean>;
    cache?: CultureCacheBinding;
    readModelRevisions?: Record<string, string>;
  } = {}
) => {
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

  const readModel = options.readModelRevisions
    ? null
    : options.cache
      ? await readCultureReadModelCache(options.cache)
      : null;
  const readModelRevisions = options.readModelRevisions ?? readModel?.revisions ?? {};
  let refreshed = 0;
  const refreshedCultureIds: number[] = [];
  for (const row of result.results ?? []) {
    if (options.beforeEach && !(await options.beforeEach())) {
      throw new Error(INITIALIZE_LOCK_LEASE_LOST_MESSAGE);
    }
    try {
      const cultureId = Number(row.id);
      const didRefresh = await refreshCachedDetail(
        config,
        d1,
        row as StaleDetailRow,
        options.beforeEach,
        options.cache,
        readModelRevisions[String(row.id)] ?? 'legacy-read-model'
      );
      if (didRefresh) {
        refreshed += 1;
        if (Number.isInteger(cultureId) && cultureId > 0) {
          refreshedCultureIds.push(cultureId);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message === INITIALIZE_LOCK_LEASE_LOST_MESSAGE) {
        throw error;
      }

      if (options.beforeEach && !(await options.beforeEach())) {
        throw new Error(INITIALIZE_LOCK_LEASE_LOST_MESSAGE);
      }

      const sourceKey = String(row.sourceKey ?? '');
      const failCount = Number(row.detailSyncFailCount ?? 0) + 1;
      const retryAt = new Date(Date.now() + retryDelayMinutes(failCount, sourceKey) * 60 * 1000).toISOString();
      await d1
        .prepare(
          `UPDATE cultures
           SET detail_sync_fail_count = ?, detail_next_retry_at = ?, detail_last_error = ?, updated_at = CURRENT_TIMESTAMP
           WHERE source_key = ?`
        )
        .bind(failCount, retryAt, error instanceof Error ? error.message.slice(0, 1000) : '상세 API 요청 실패', sourceKey)
        .run();
      console.warn(`TourAPI 상세 캐시 보강을 재시도합니다. sourceKey=${sourceKey}`, error);
    }
  }

  return { refreshed, refreshedCultureIds };
};

export const publishCurrentCultureDetailReadModels = async (
  d1: D1Binding,
  cache?: CultureCacheBinding,
  readModelRevisions?: Record<string, string>
) => {
  if (!cache) return { attempted: 0, published: 0 };

  const result = await d1
    .prepare(
      `SELECT ${CULTURE_CONTENT_SELECT}, ${CULTURE_DETAIL_SELECT}
       FROM cultures
       INNER JOIN culture_tour_api_details details ON details.source_key = cultures.source_key
       WHERE cultures.is_active = 1
         AND cultures.end_date >= ?
         AND details.is_complete = 1
         AND details.source_modified_at IS cultures.registration_date
       ORDER BY cultures.id`
    )
    .bind(getKoreaDateStartIso())
    .all();

  const rows = result.results ?? [];
  const readModel = readModelRevisions ? null : await readCultureReadModelCache(cache);
  const revisions = readModelRevisions ?? readModel?.revisions ?? {};
  let published = 0;
  let skipped = 0;

  for (let index = 0; index < rows.length; index += DETAIL_READ_MODEL_WRITE_BATCH_SIZE) {
    const batch = rows.slice(index, index + DETAIL_READ_MODEL_WRITE_BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async rawRow => {
        const row = rawRow as StaleDetailRow & Record<string, unknown>;
        const cultureId = Number(row.id);
        if (!Number.isInteger(cultureId) || cultureId < 1) return 'skipped' as const;
        const cacheVersion = revisions[String(cultureId)] ?? 'legacy-read-model';

        const existing = await readCultureDetailCache(cultureId, cache);
        const existingUpdatedAt = existing?.culture?.updatedAt
          ? new Date(existing.culture.updatedAt).getTime()
          : Number.NaN;
        const rowUpdatedAt = row.updatedAt ? new Date(row.updatedAt).getTime() : Number.NaN;
        if (
          existing?.cacheVersion === cacheVersion &&
          Number.isFinite(existingUpdatedAt) &&
          Number.isFinite(rowUpdatedAt) &&
          existingUpdatedAt === rowUpdatedAt
        ) {
          return 'skipped' as const;
        }

        const detailRow = toCultureTourApiDetailsRow(row);
        if (!detailRow) return 'skipped' as const;
        const culture = mapCultureRowToCulture(row, parseStoredTourApiDetails(detailRow));
        const written = await writeCultureDetailCache(
          culture.id,
          cacheVersion,
          culture,
          DETAIL_READ_MODEL_TTL_SECONDS,
          cache
        );
        return written ? 'published' as const : 'failed' as const;
      })
    );
    published += results.filter(result => result === 'published').length;
    skipped += results.filter(result => result === 'skipped').length;
  }

  console.info(`[read-model] detail publish attempted=${rows.length} published=${published} skipped=${skipped}`);
  return { attempted: rows.length, published, skipped };
};
