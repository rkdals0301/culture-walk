import { CultureCategoryKey, matchesCultureCategory } from '@/utils/cultureCategory';
import type { MapSortMode } from '@/utils/exploreState';
import { calculateDistanceMeters } from '@/utils/geo';
import { CultureListItem, CultureSearchableListItem } from '@/types/culture';

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

const normalizeText = (value: string | null | undefined) =>
  value?.normalize('NFKC').trim().toLocaleLowerCase('ko-KR') ?? '';

const tokenizeSearchQuery = (query: string) =>
  normalizeText(query)
    .split(/\s+/)
    .filter(Boolean);

const getCultureSearchText = (culture: CultureSearchableListItem) =>
  normalizeText(culture.searchText || [culture.title, culture.guName, culture.place].join(' '));

const getCultureSearchScore = (culture: CultureSearchableListItem, query: string, tokens: readonly string[]) => {
  if (!query) return 0;

  const title = normalizeText(culture.title);
  const place = normalizeText(culture.place);
  const region = normalizeText(culture.guName);
  const searchText = getCultureSearchText(culture);
  let score = 0;

  if (title === query) score += 1_000;
  else if (title.startsWith(query)) score += 800;
  else if (title.includes(query)) score += 650;

  if (place === query) score += 500;
  else if (place.includes(query)) score += 350;

  if (region === query) score += 450;
  else if (region.includes(query)) score += 300;

  for (const token of tokens) {
    if (title === token) score += 120;
    else if (title.startsWith(token)) score += 100;
    else if (title.includes(token)) score += 80;

    if (place.includes(token)) score += 35;
    if (region.includes(token)) score += 30;
    if (searchText.includes(token)) score += 10;
  }

  return score;
};

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

export const createCultureFeedCursor = (offset: number, filters: CultureFeedFilters) =>
  encodeURIComponent(
    JSON.stringify({
      offset: Math.max(0, Math.floor(offset)),
      filters: createCultureFeedFilterKey(filters),
    })
  );

const matchesCultureFeedFilters = (
  culture: CultureSearchableListItem,
  filters: CultureFeedFilters,
  queryTokens: readonly string[]
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

  if (queryTokens.length > 0 && !queryTokens.every(token => getCultureSearchText(culture).includes(token))) {
    return false;
  }

  return true;
};

export const buildCultureFeedResult = (
  items: readonly CultureSearchableListItem[],
  filters: CultureFeedFilters
): CultureFeedResult => {
  const normalized = normalizeCultureFeedFilters(filters);
  const query = normalizeText(normalized.searchQuery);
  const queryTokens = tokenizeSearchQuery(query);
  const regionSet = new Set<string>();
  const filteredItems: CultureListItem[] = [];
  let freeCount = 0;

  for (const culture of items) {
    const region = (culture.guName ?? '').split(/\s+/)[0];
    if (region) {
      regionSet.add(region);
    }

    if (!matchesCultureFeedFilters(culture, normalized, queryTokens)) {
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
  } else if (query) {
    filteredItems.sort(
      (a, b) => getCultureSearchScore(b, query, queryTokens) - getCultureSearchScore(a, query, queryTokens)
    );
  }

  return {
    items: filteredItems,
    freeCount,
    regionOptions: Array.from(regionSet).sort((a, b) => a.localeCompare(b, 'ko')),
  };
};

export const filterCultureListItems = (items: readonly CultureSearchableListItem[], filters: CultureFeedFilters) => {
  return buildCultureFeedResult(items, filters).items;
};

export const getCultureRegionOptions = (items: readonly CultureSearchableListItem[]) =>
  Array.from(new Set(items.map(culture => (culture.guName ?? '').split(/\s+/)[0]).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'ko')
  );
