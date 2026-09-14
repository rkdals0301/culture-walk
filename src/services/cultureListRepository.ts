import { toCultureListItem } from '@/services/cultureD1Repository';
import {
  type D1Binding,
  KOREA_LAT_MAX,
  KOREA_LAT_MIN,
  KOREA_LNG_MAX,
  KOREA_LNG_MIN,
} from '@/services/cultureSyncTypes';
import type { CultureListItem, CultureSearchableListItem } from '@/types/culture';
import { sortCulturesByRelevantDate } from '@/utils/cultureSort';
import { getKoreaDateStartIso } from '@/utils/dateUtils';

const hashCultureListItem = (item: CultureListItem) => {
  const payload = JSON.stringify([
    item.classification,
    item.endDate,
    item.guName,
    item.isFree,
    item.lat,
    item.lng,
    item.mainImage,
    item.place,
    item.startDate,
    item.title,
    item.useFee,
  ]);
  let hash = 2166136261;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

const buildCultureSearchText = (item: CultureListItem, row: Record<string, unknown>) =>
  [
    item.title,
    item.guName,
    item.place,
    row.programIntroduction,
    row.useTarget,
    row.organizationName,
    row.themeClassification,
    row.overview,
  ]
    .filter(value => typeof value === 'string' && value.trim())
    .join('\n');

export const createCultureListItemRevision = (item: CultureListItem, sourceModifiedAt?: string | null) =>
  `${sourceModifiedAt ?? ''}:${hashCultureListItem(item)}`;

export const queryCultureListFromD1 = async (d1: D1Binding) => {
  const koreaToday = getKoreaDateStartIso();
  const result = await d1
    .prepare(
      `SELECT cultures.id AS id, cultures.classification AS classification, cultures.end_date AS endDate,
              cultures.gu_name AS guName, cultures.is_free AS isFree, cultures.lat AS lat, cultures.lng AS lng,
              cultures.main_image AS mainImage, cultures.place AS place, cultures.start_date AS startDate,
              cultures.title AS title, cultures.use_fee AS useFee, cultures.registration_date AS sourceModifiedAt,
              cultures.program_introduction AS programIntroduction, cultures.use_target AS useTarget,
              cultures.organization_name AS organizationName, cultures.theme_classification AS themeClassification,
              json_extract(details.common_json, '$.overview') AS overview
       FROM cultures
       LEFT JOIN culture_tour_api_details details
         ON details.source_key = cultures.source_key
        AND details.is_complete = 1
        AND details.source_modified_at IS cultures.registration_date
       WHERE cultures.is_active = 1
         AND cultures.lat IS NOT NULL
         AND cultures.lng IS NOT NULL
         AND cultures.start_date IS NOT NULL
         AND cultures.end_date IS NOT NULL
         AND (
           (cultures.lat BETWEEN ? AND ? AND cultures.lng BETWEEN ? AND ?)
           OR (cultures.lng BETWEEN ? AND ? AND cultures.lat BETWEEN ? AND ?)
         )
         AND cultures.end_date >= ?`
    )
    .bind(
      KOREA_LAT_MIN,
      KOREA_LAT_MAX,
      KOREA_LNG_MIN,
      KOREA_LNG_MAX,
      KOREA_LAT_MIN,
      KOREA_LAT_MAX,
      KOREA_LNG_MIN,
      KOREA_LNG_MAX,
      koreaToday
    )
    .all();

  const revisions: Record<string, string> = {};
  const items = (result.results ?? []).flatMap<CultureSearchableListItem>(row => {
    const item = toCultureListItem(row);
    if (!item) return [];
    revisions[String(item.id)] = createCultureListItemRevision(item, String(row.sourceModifiedAt ?? ''));
    return [{ ...item, searchText: buildCultureSearchText(item, row) }];
  });

  return { items: sortCulturesByRelevantDate(items, koreaToday), revisions };
};
