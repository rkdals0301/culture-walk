import { CultureCategoryKey, matchesCultureCategory } from '@/utils/cultureCategory';
import type { MapSortMode } from '@/utils/exploreState';
import { calculateDistanceMeters } from '@/utils/geo';
import { CultureListItem } from '@/types/culture';

export interface CultureFeedFilters {
  searchQuery: string;
  category: CultureCategoryKey;
  region: string;
  freeOnly: boolean;
  sortMode?: MapSortMode;
  userLat?: number | null;
  userLng?: number | null;
}

export interface CultureFeedResult {
  items: CultureListItem[];
  freeCount: number;
  regionOptions: string[];
}

const FREE_VALUE_PATTERN = /무료|free/i;
const MAX_SEARCH_LENGTH = 100;
const MAX_REGION_LENGTH = 40;

const normalizeText = (value: string | null | undefined) => value?.trim().toLocaleLowerCase('ko-KR') ?? '';

export const isFreeCultureListItem = (culture: Pick<CultureListItem, 'isFree' | 'useFee'>) =>
  FREE_VALUE_PATTERN.test(`${culture.isFree} ${culture.useFee}`);

export const normalizeCultureFeedFilters = (filters: CultureFeedFilters): CultureFeedFilters => ({
  searchQuery: filters.searchQuery.trim().slice(0, MAX_SEARCH_LENGTH),
  category: filters.category,
  region: filters.region.trim().slice(0, MAX_REGION_LENGTH),
  freeOnly: filters.freeOnly,
  sortMode: filters.sortMode === 'distance' ? 'distance' : 'date',
  userLat: typeof filters.userLat === 'number' && Number.isFinite(filters.userLat) ? filters.userLat : null,
  userLng: typeof filters.userLng === 'number' && Number.isFinite(filters.userLng) ? filters.userLng : null,
});

export const createCultureFeedFilterKey = (filters: CultureFeedFilters) =>
  JSON.stringify(normalizeCultureFeedFilters(filters));

const matchesCultureFeedFilters = (
  culture: CultureListItem,
  filters: CultureFeedFilters,
  query: string
) => {
  if (!matchesCultureCategory(culture.classification, filters.category)) {
    return false;
  }

  if (filters.region !== 'all' && (culture.guName ?? '').split(/\s+/)[0] !== filters.region) {
    return false;
  }

  if (filters.freeOnly && !isFreeCultureListItem(culture)) {
    return false;
  }

  if (
    query &&
    ![culture.title, culture.guName, culture.place].some(value => normalizeText(value).includes(query))
  ) {
    return false;
  }

  return true;
};

export const buildCultureFeedResult = (
  items: readonly CultureListItem[],
  filters: CultureFeedFilters
): CultureFeedResult => {
  const normalized = normalizeCultureFeedFilters(filters);
  const query = normalizeText(normalized.searchQuery);
  const regionSet = new Set<string>();
  const filteredItems: CultureListItem[] = [];
  let freeCount = 0;

  for (const culture of items) {
    const region = (culture.guName ?? '').split(/\s+/)[0];
    if (region) {
      regionSet.add(region);
    }

    if (!matchesCultureFeedFilters(culture, normalized, query)) {
      continue;
    }

    filteredItems.push(culture);
    if (isFreeCultureListItem(culture)) {
      freeCount += 1;
    }
  }

  if (normalized.sortMode === 'distance' && normalized.userLat != null && normalized.userLng != null) {
    const userPoint = { lat: normalized.userLat, lng: normalized.userLng };
    filteredItems.sort((a, b) => {
      const distA = calculateDistanceMeters(userPoint, { lat: a.lat, lng: a.lng });
      const distB = calculateDistanceMeters(userPoint, { lat: b.lat, lng: b.lng });
      return distA - distB;
    });
  }

  return {
    items: filteredItems,
    freeCount,
    regionOptions: Array.from(regionSet).sort((a, b) => a.localeCompare(b, 'ko')),
  };
};

export const filterCultureListItems = (items: readonly CultureListItem[], filters: CultureFeedFilters) => {
  return buildCultureFeedResult(items, filters).items;
};

export const getCultureRegionOptions = (items: readonly CultureListItem[]) =>
  Array.from(new Set(items.map(culture => (culture.guName ?? '').split(/\s+/)[0]).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'ko')
  );
