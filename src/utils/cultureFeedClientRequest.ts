import type { CultureFeedFilters } from '@/services/cultureFeed';
import type { FormattedCultureListItem } from '@/types/culture';
import type { CultureCategoryKey } from '@/utils/cultureCategory';
import type { MapSortMode } from '@/utils/exploreState';
import type { GeoPoint } from '@/utils/geo';

interface CreateCultureFeedClientFiltersOptions {
  searchQuery: string;
  category: CultureCategoryKey;
  region: string;
  freeOnly: boolean;
  sortMode: MapSortMode;
  currentLocation?: GeoPoint | null;
}

export const createCultureFeedClientFilters = ({
  searchQuery,
  category,
  region,
  freeOnly,
  sortMode,
  currentLocation = null,
}: CreateCultureFeedClientFiltersOptions): CultureFeedFilters => {
  const usesDistance = sortMode === 'distance' && Boolean(currentLocation);
  return {
    searchQuery,
    category,
    region,
    freeOnly,
    sortMode: usesDistance ? 'distance' : 'date',
    userLat: usesDistance ? currentLocation?.lat ?? null : null,
    userLng: usesDistance ? currentLocation?.lng ?? null : null,
  };
};

export const createCultureFeedClientCacheKey = (filters: CultureFeedFilters) =>
  `${filters.searchQuery}|${filters.category}|${filters.region}|${filters.freeOnly ? '1' : '0'}|${filters.sortMode ?? 'date'}|${filters.userLat != null ? filters.userLat.toFixed(4) : ''}|${filters.userLng != null ? filters.userLng.toFixed(4) : ''}`;

export const createCultureFeedRequestParams = (filters: CultureFeedFilters, cursor: string | null) => {
  const params: Record<string, string | number> = {
    limit: 20,
    category: filters.category,
    region: filters.region,
    free: filters.freeOnly ? '1' : '0',
  };

  if (filters.searchQuery) params.q = filters.searchQuery;
  if (filters.sortMode) params.sort = filters.sortMode;
  if (filters.userLat != null && filters.userLng != null) {
    params.lat = filters.userLat;
    params.lng = filters.userLng;
  }
  if (cursor) params.cursor = cursor;
  return params;
};

export const mergeCultureFeedItems = (
  current: FormattedCultureListItem[],
  nextItems: FormattedCultureListItem[],
  append: boolean
) => {
  if (!append) return nextItems;

  const existingIds = new Set(current.map(item => item.id));
  const uniqueItems = nextItems.filter(item => !existingIds.has(item.id));
  return uniqueItems.length > 0 ? [...current, ...uniqueItems] : current;
};
