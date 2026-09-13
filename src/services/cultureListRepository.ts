import { toCultureListItem } from '@/services/cultureD1Repository';
import {
  type D1Binding,
  KOREA_LAT_MAX,
  KOREA_LAT_MIN,
  KOREA_LNG_MAX,
  KOREA_LNG_MIN,
} from '@/services/cultureSyncTypes';
import type { CultureListItem } from '@/types/culture';
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

export const createCultureListItemRevision = (item: CultureListItem, sourceModifiedAt?: string | null) =>
  `${sourceModifiedAt ?? ''}:${hashCultureListItem(item)}`;

export const queryCultureListFromD1 = async (d1: D1Binding) => {
  const koreaToday = getKoreaDateStartIso();
  const result = await d1
    .prepare(
      `SELECT id, classification, end_date AS endDate, gu_name AS guName, is_free AS isFree,
              lat, lng, main_image AS mainImage, place, start_date AS startDate, title, use_fee AS useFee,
              registration_date AS sourceModifiedAt
       FROM cultures
       WHERE is_active = 1
         AND lat IS NOT NULL
         AND lng IS NOT NULL
         AND start_date IS NOT NULL
         AND end_date IS NOT NULL
         AND (
           (lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?)
           OR (lng BETWEEN ? AND ? AND lat BETWEEN ? AND ?)
         )
         AND end_date >= ?`
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
  const items = (result.results ?? []).flatMap(row => {
    const item = toCultureListItem(row);
    if (!item) return [];
    revisions[String(item.id)] = createCultureListItemRevision(item, String(row.sourceModifiedAt ?? ''));
    return [item];
  });

  return { items: sortCulturesByRelevantDate(items, koreaToday), revisions };
};
