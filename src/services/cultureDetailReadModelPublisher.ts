import {
  type CultureCacheBinding,
  readCultureDetailCache,
  readCultureReadModelCache,
  writeCultureDetailCache,
} from '@/cache/kv';
import { CULTURE_CONTENT_SELECT, CULTURE_DETAIL_SELECT, toCultureTourApiDetailsRow } from '@/services/cultureD1Repository';
import { mapCultureRowToCulture, type CultureContentRow } from '@/services/cultureService';
import { parseStoredTourApiDetails } from '@/services/tourApiDetails';
import { getKoreaDateStartIso } from '@/utils/dateUtils';

import type { D1Binding } from './cultureSyncTypes';

export const DETAIL_READ_MODEL_TTL_SECONDS = 60 * 60 * 24 * 7;
const DETAIL_READ_MODEL_WRITE_BATCH_SIZE = 25;

type DetailReadModelRow = CultureContentRow & Record<string, unknown>;

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
        const row = rawRow as DetailReadModelRow;
        const cultureId = Number(row.id);
        if (!Number.isInteger(cultureId) || cultureId < 1) return 'skipped' as const;
        const cacheVersion = revisions[String(cultureId)] ?? 'legacy-read-model';

        const existing = await readCultureDetailCache(cultureId, cache);
        const existingUpdatedAt = existing?.culture?.updatedAt
          ? new Date(existing.culture.updatedAt).getTime()
          : Number.NaN;
        const rowUpdatedAt = row.updatedAt ? new Date(row.updatedAt as string).getTime() : Number.NaN;
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
