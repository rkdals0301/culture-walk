import { readCulturesListCache } from '@/cache/kv';
import { getDb } from '@/db/client';
import { cultures } from '@/db/schema';
import { normalizeCultureClassification, normalizeCultureCoordinates } from '@/services/cultureService';
import { KOREA_LAT_MAX, KOREA_LAT_MIN, KOREA_LNG_MAX, KOREA_LNG_MIN } from '@/services/cultureSyncTypes';
import { CultureListItem, CultureMapBounds, CultureMapResponse } from '@/types/culture';
import { createCultureFeedFilterKey, CultureFeedFilters, normalizeCultureFeedFilters } from '@/services/cultureFeed';
import { sortCulturesByRelevantDate } from '@/utils/cultureSort';
import { getKoreaDateStartIso } from '@/utils/dateUtils';

import { and, eq, gte, isNotNull, or, sql, type SQL } from 'drizzle-orm';
import type { AnyColumn } from 'drizzle-orm/column';

const TOTAL_COUNT_CACHE_TTL_MS = 15_000;
const TOTAL_COUNT_CACHE_MAX_ENTRIES = 32;

interface TotalCountCacheEntry {
  count?: number;
  expiresAt: number;
  promise?: Promise<number>;
}

// A short-lived isolate-local cache avoids running the same full-filter COUNT
// for every small map pan. The viewport query remains fresh on each request.
const totalCountCache = new Map<string, TotalCountCacheEntry>();

const getCachedTotalCount = async (key: string, query: () => Promise<number>) => {
  const cached = totalCountCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    if (cached.promise) return cached.promise;
    if (cached.count !== undefined) return cached.count;
  }

  const promise = Promise.resolve().then(query);
  totalCountCache.set(key, {
    expiresAt: Date.now() + TOTAL_COUNT_CACHE_TTL_MS,
    promise,
  });

  try {
    const count = await promise;
    totalCountCache.set(key, {
      count,
      expiresAt: Date.now() + TOTAL_COUNT_CACHE_TTL_MS,
    });

    while (totalCountCache.size > TOTAL_COUNT_CACHE_MAX_ENTRIES) {
      const oldestKey = totalCountCache.keys().next().value;
      if (oldestKey === undefined) break;
      totalCountCache.delete(oldestKey);
    }

    return count;
  } catch (error) {
    if (totalCountCache.get(key)?.promise === promise) {
      totalCountCache.delete(key);
    }
    throw error;
  }
};

const MAP_CATEGORY_KEYWORDS: Record<Exclude<CultureFeedFilters['category'], 'all'>, string[]> = {
  education: ['교육', '체험'],
  exhibition: ['전시', '미술'],
  performance: ['공연', '클래식', '콘서트', '연극', '무용', '뮤지컬', '오페라', '영화', '독주', '독창', '국악'],
  festival: ['축제'],
};

const includesNormalizedText = (value: string | null | undefined, query: string) =>
  (value ?? '').toLocaleLowerCase('ko-KR').includes(query);

const matchesMapFilters = (culture: CultureListItem, filters: CultureFeedFilters) => {
  if (
    filters.category !== 'all' &&
    !MAP_CATEGORY_KEYWORDS[filters.category].some(keyword => (culture.classification ?? '').includes(keyword))
  ) {
    return false;
  }

  if (
    filters.region !== 'all' &&
    culture.guName !== filters.region &&
    !culture.guName.startsWith(`${filters.region} `)
  ) {
    return false;
  }

  if (filters.freeOnly && !/무료|free/i.test(`${culture.isFree} ${culture.useFee}`)) {
    return false;
  }

  const query = filters.searchQuery.toLocaleLowerCase('ko-KR');
  if (
    query &&
    ![culture.title, culture.guName, culture.place].some(value => includesNormalizedText(value, query))
  ) {
    return false;
  }

  return true;
};

const getTotalCountFromListCache = async (filters: CultureFeedFilters) => {
  const cachedCultures = await readCulturesListCache();
  if (!cachedCultures) return null;

  return cachedCultures.reduce((count, culture) => count + (matchesMapFilters(culture, filters) ? 1 : 0), 0);
};

export const CULTURE_MAP_REGION_OPTIONS = [
  '서울',
  '부산',
  '대구',
  '인천',
  '광주',
  '대전',
  '울산',
  '세종',
  '경기',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
  '광주·전남',
] as const;

const toDateOrNow = (value?: string | null) => {
  if (!value) return new Date();

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date();
  return parsed;
};

const toCultureListItem = (row: {
  id: number;
  classification: string | null;
  endDate: string | null;
  guName: string | null;
  isFree: string | null;
  lat: number | null;
  lng: number | null;
  mainImage: string | null;
  place: string | null;
  startDate: string | null;
  title: string | null;
  useFee: string | null;
}): CultureListItem => {
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
};

const containsText = (column: AnyColumn, value: string): SQL =>
  sql`lower(coalesce(${column}, '')) LIKE ${`%${value.toLocaleLowerCase('ko-KR')}%`}`;

const getCategoryCondition = (category: CultureFeedFilters['category']): SQL | undefined => {
  if (category === 'all') return undefined;

  return or(...MAP_CATEGORY_KEYWORDS[category].map(keyword => containsText(cultures.classification, keyword))) ?? sql`FALSE`;
};

const escapeLikeValue = (value: string) => value.replace(/[\\%_]/g, '\\$&');

const getFilterConditions = (filters: CultureFeedFilters): SQL[] => {
  const conditions: SQL[] = [];
  const categoryCondition = getCategoryCondition(filters.category);

  if (categoryCondition) {
    conditions.push(categoryCondition);
  }

  if (filters.region !== 'all') {
    const region = escapeLikeValue(filters.region);
    const regionCondition = or(
      eq(cultures.guName, filters.region),
      sql`${cultures.guName} LIKE ${`${region} %`} ESCAPE '\\'`
    );
    if (regionCondition) {
      conditions.push(regionCondition);
    }
  }

  if (filters.freeOnly) {
    const freeCondition = or(
      sql`coalesce(${cultures.isFree}, '') LIKE ${'%무료%'}`,
      sql`lower(coalesce(${cultures.isFree}, '')) LIKE ${'%free%'}`,
      sql`coalesce(${cultures.useFee}, '') LIKE ${'%무료%'}`,
      sql`lower(coalesce(${cultures.useFee}, '')) LIKE ${'%free%'}`
    );
    if (freeCondition) {
      conditions.push(freeCondition);
    }
  }

  if (filters.searchQuery) {
    const searchCondition = or(
      containsText(cultures.title, filters.searchQuery),
      containsText(cultures.guName, filters.searchQuery),
      containsText(cultures.place, filters.searchQuery)
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  return conditions;
};

const getCountryCoordinateCondition = (): SQL =>
  or(
    and(
      sql`${cultures.lat} BETWEEN ${KOREA_LAT_MIN} AND ${KOREA_LAT_MAX}`,
      sql`${cultures.lng} BETWEEN ${KOREA_LNG_MIN} AND ${KOREA_LNG_MAX}`
    ),
    and(
      sql`${cultures.lng} BETWEEN ${KOREA_LAT_MIN} AND ${KOREA_LAT_MAX}`,
      sql`${cultures.lat} BETWEEN ${KOREA_LNG_MIN} AND ${KOREA_LNG_MAX}`
    )
  ) ?? sql`FALSE`;

const getViewportCoordinateCondition = (bounds: CultureMapBounds): SQL =>
  or(
    and(
      sql`${cultures.lat} BETWEEN ${bounds.swLat} AND ${bounds.neLat}`,
      sql`${cultures.lng} BETWEEN ${bounds.swLng} AND ${bounds.neLng}`
    ),
    and(
      sql`${cultures.lng} BETWEEN ${bounds.swLat} AND ${bounds.neLat}`,
      sql`${cultures.lat} BETWEEN ${bounds.swLng} AND ${bounds.neLng}`
    )
  ) ?? sql`FALSE`;

export const getCultureMapData = async (
  input: { filters: CultureFeedFilters; bounds: CultureMapBounds }
): Promise<CultureMapResponse | null> => {
  const db = await getDb();
  if (!db) return null;

  const filters = normalizeCultureFeedFilters(input.filters);
  const koreaToday = getKoreaDateStartIso();
  const baseConditions: SQL[] = [
    eq(cultures.isActive, true),
    isNotNull(cultures.lat),
    isNotNull(cultures.lng),
    isNotNull(cultures.startDate),
    isNotNull(cultures.endDate),
    getCountryCoordinateCondition(),
    gte(cultures.endDate, koreaToday),
    ...getFilterConditions(filters),
  ];
  const baseWhere = and(...baseConditions);
  const viewportWhere = and(baseWhere, getViewportCoordinateCondition(input.bounds));
  const totalCountKey = `${koreaToday}:${createCultureFeedFilterKey(filters)}`;

  const [totalCount, viewportRows] = await Promise.all([
    getCachedTotalCount(totalCountKey, async () => {
      const cachedTotalCount = await getTotalCountFromListCache(filters);
      if (cachedTotalCount !== null) return cachedTotalCount;

      const totalRows = await db.select({ count: sql<number>`count(*)` }).from(cultures).where(baseWhere);
      return Number(totalRows[0]?.count ?? 0);
    }),
    db
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
      .where(viewportWhere),
  ]);

  const items = sortCulturesByRelevantDate(viewportRows.map(toCultureListItem), koreaToday);

  return {
    items,
    totalCount,
    viewportCount: items.length,
    regionOptions: [...CULTURE_MAP_REGION_OPTIONS],
  };
};
