import { cultures } from '@/db/schema';
import type { CultureListItem, CultureMapBounds } from '@/types/culture';
import type { CultureFeedFilters } from '@/services/cultureFeed';
import { normalizeCultureClassification, normalizeCultureCoordinates } from '@/services/cultureService';
import { KOREA_LAT_MAX, KOREA_LAT_MIN, KOREA_LNG_MAX, KOREA_LNG_MIN } from '@/services/cultureSyncTypes';

import { and, eq, gte, isNotNull, or, sql, type SQL } from 'drizzle-orm';
import type { AnyColumn } from 'drizzle-orm/column';

export const CULTURE_REGION_OPTIONS = [
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

export const CULTURE_LIST_SELECTION = {
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
};

export interface CultureListSelectionRow {
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
}

const CATEGORY_KEYWORDS: Record<Exclude<CultureFeedFilters['category'], 'all'>, string[]> = {
  education: ['교육', '체험'],
  exhibition: ['전시', '미술'],
  performance: ['공연', '클래식', '콘서트', '연극', '무용', '뮤지컬', '오페라', '영화', '독주', '독창', '국악'],
  festival: ['축제'],
};

const toDateOrNow = (value?: string | null) => {
  if (!value) return new Date();

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date();
  return parsed;
};

export const mapCultureListRowToItem = (row: CultureListSelectionRow): CultureListItem => {
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

const escapeLikeValue = (value: string) => value.replace(/[\\%_]/g, '\\$&');

export const getCultureCategoryCondition = (category: CultureFeedFilters['category']): SQL | undefined => {
  if (category === 'all') return undefined;

  return or(...CATEGORY_KEYWORDS[category].map(keyword => containsText(cultures.classification, keyword))) ?? sql`FALSE`;
};

export const getCultureFreeCondition = (): SQL =>
  or(
    sql`coalesce(${cultures.isFree}, '') LIKE ${'%무료%'}`,
    sql`lower(coalesce(${cultures.isFree}, '')) LIKE ${'%free%'}`,
    sql`coalesce(${cultures.useFee}, '') LIKE ${'%무료%'}`,
    sql`lower(coalesce(${cultures.useFee}, '')) LIKE ${'%free%'}`
  ) ?? sql`FALSE`;

export const getCultureFilterConditions = (
  filters: CultureFeedFilters,
  options: { includeFree?: boolean } = {}
): SQL[] => {
  const conditions: SQL[] = [];
  const categoryCondition = getCultureCategoryCondition(filters.category);

  if (categoryCondition) {
    conditions.push(categoryCondition);
  }

  if (filters.region !== 'all') {
    const region = escapeLikeValue(filters.region);
    conditions.push(
      or(
        eq(cultures.guName, filters.region),
        sql`${cultures.guName} LIKE ${`${region} %`} ESCAPE '\\'`
      ) ?? sql`FALSE`
    );
  }

  if (options.includeFree !== false && filters.freeOnly) {
    conditions.push(getCultureFreeCondition());
  }

  if (filters.searchQuery) {
    conditions.push(
      or(
        containsText(cultures.title, filters.searchQuery),
        containsText(cultures.guName, filters.searchQuery),
        containsText(cultures.place, filters.searchQuery)
      ) ?? sql`FALSE`
    );
  }

  return conditions;
};

export const getCountryCoordinateCondition = (): SQL =>
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

export const getCultureBaseConditions = (filters: CultureFeedFilters, koreaToday: string): SQL[] => [
  eq(cultures.isActive, true),
  isNotNull(cultures.lat),
  isNotNull(cultures.lng),
  isNotNull(cultures.startDate),
  isNotNull(cultures.endDate),
  getCountryCoordinateCondition(),
  gte(cultures.endDate, koreaToday),
  ...getCultureFilterConditions(filters),
];

export const getViewportCoordinateCondition = (bounds: CultureMapBounds): SQL =>
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

export const getCultureRelevantDateExpression = (koreaToday: string) =>
  sql`CASE WHEN ${cultures.startDate} <= ${koreaToday} THEN ${cultures.endDate} ELSE ${cultures.startDate} END`;
