import { readCulturesListCache, readCulturesListFallbackCache, writeCulturesListCaches } from '@/cache/kv';
import { getDb } from '@/db/client';
import { cultures } from '@/db/schema';
import { hasD1DailyRowReadLimitError } from '@/server/sqliteError';
import { normalizeCultureClassification, normalizeCultureCoordinates } from '@/services/cultureService';
import { KOREA_LAT_MAX, KOREA_LAT_MIN, KOREA_LNG_MAX, KOREA_LNG_MIN } from '@/services/cultureSyncTypes';
import { CultureListItem } from '@/types/culture';
import { sortCulturesByRelevantDate } from '@/utils/cultureSort';
import { getKoreaDateStartIso } from '@/utils/dateUtils';

import { and, eq, gte, isNotNull, or, sql } from 'drizzle-orm';

export type CultureListSnapshotSource = 'kv-list-cache' | 'd1' | 'kv-list-fallback';

export interface CultureListSnapshot {
  items: CultureListItem[];
  source: CultureListSnapshotSource;
}

const CULTURE_LIST_CACHE_TTL_SECONDS = 60 * 60;

const toDateOrNow = (value?: string | null) => {
  if (!value) return new Date();

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date();
  return parsed;
};

const queryCultureListFromD1 = async () => {
  const db = await getDb();
  if (!db) return null;

  const koreaToday = getKoreaDateStartIso();
  const rows = await db
    .select({
      id: cultures.id,
      classification: cultures.classification,
      endDate: cultures.endDate,
      guName: cultures.guName,
      isFree: cultures.isFree,
      lat: cultures.lat,
      lng: cultures.lng,
      mainImage: cultures.mainImage,
      place: cultures.place,
      startDate: cultures.startDate,
      title: cultures.title,
      useFee: cultures.useFee,
    })
    .from(cultures)
    .where(
      and(
        eq(cultures.isActive, true),
        isNotNull(cultures.lat),
        isNotNull(cultures.lng),
        isNotNull(cultures.startDate),
        isNotNull(cultures.endDate),
        or(
          and(
            sql`${cultures.lat} BETWEEN ${KOREA_LAT_MIN} AND ${KOREA_LAT_MAX}`,
            sql`${cultures.lng} BETWEEN ${KOREA_LNG_MIN} AND ${KOREA_LNG_MAX}`
          ),
          and(
            sql`${cultures.lng} BETWEEN ${KOREA_LAT_MIN} AND ${KOREA_LAT_MAX}`,
            sql`${cultures.lat} BETWEEN ${KOREA_LNG_MIN} AND ${KOREA_LNG_MAX}`
          )
        ),
        gte(cultures.endDate, koreaToday)
      )
    );

  const items: CultureListItem[] = rows.map(row => {
    const coordinates = normalizeCultureCoordinates(row.lat, row.lng);

    return {
      id: row.id,
      classification: normalizeCultureClassification(row.classification),
      endDate: toDateOrNow(row.endDate ?? row.startDate),
      guName: row.guName ?? '',
      isFree: row.isFree ?? '',
      lat: coordinates.lat,
      lng: coordinates.lng,
      mainImage: row.mainImage ?? '/assets/images/logo.svg',
      place: row.place ?? '',
      startDate: toDateOrNow(row.startDate),
      title: row.title ?? '',
      useFee: row.useFee ?? '',
    };
  });

  return sortCulturesByRelevantDate(items, koreaToday);
};

export const refreshCultureListSnapshotCache = async () => {
  const items = await queryCultureListFromD1();
  if (!items) return null;

  await writeCulturesListCaches(items, CULTURE_LIST_CACHE_TTL_SECONDS);
  return items;
};

export const getCultureListSnapshot = async (): Promise<CultureListSnapshot | null> => {
  const cached = await readCulturesListCache();
  if (cached) {
    return { items: cached, source: 'kv-list-cache' };
  }

  try {
    const items = await refreshCultureListSnapshotCache();
    if (!items) return null;
    return { items, source: 'd1' };
  } catch (error) {
    if (hasD1DailyRowReadLimitError(error)) {
      const fallback = await readCulturesListFallbackCache();
      if (fallback) {
        // Temporarily promote the last known good snapshot so paginated feed requests
        // do not retry the exhausted D1 database for every scroll page.
        await writeCulturesListCaches(fallback, 60);
        return { items: fallback, source: 'kv-list-fallback' };
      }
    }

    throw error;
  }
};
