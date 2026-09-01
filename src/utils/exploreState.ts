import type { CultureCategoryKey } from '@/utils/cultureCategory';

export type MapSortMode = 'date' | 'distance';

export type LocationStatus =
  | 'idle'
  | 'requesting'
  | 'success'
  | 'permission-denied'
  | 'timeout'
  | 'unavailable'
  | 'cancelled';

export interface MapFilterState {
  searchQuery: string;
  mapCategory: CultureCategoryKey;
  mapRegion: string;
  mapFreeOnly: boolean;
  sortMode: MapSortMode;
}

export interface MapExploreUrlState extends MapFilterState {
  mapListScrollTop: number;
  listOpen: boolean;
  focusCultureId?: number | null;
  selectedCultureId?: number | null;
}

const CULTURE_CATEGORY_KEYS: CultureCategoryKey[] = ['all', 'education', 'exhibition', 'performance', 'festival'];
const MAP_SORT_MODES: MapSortMode[] = ['date', 'distance'];

const isCultureCategoryKey = (value: unknown): value is CultureCategoryKey =>
  typeof value === 'string' && CULTURE_CATEGORY_KEYS.includes(value as CultureCategoryKey);

const isMapSortMode = (value: unknown): value is MapSortMode =>
  typeof value === 'string' && MAP_SORT_MODES.includes(value as MapSortMode);

export const serializeMapExploreStateToSearch = (state: MapExploreUrlState) => {
  const params = new URLSearchParams();
  const normalizedQuery = state.searchQuery.trim();
  const focusCultureId = state.focusCultureId;
  const selectedCultureId = state.selectedCultureId;

  if (normalizedQuery) params.set('q', normalizedQuery);
  if (state.mapCategory !== 'all') params.set('category', state.mapCategory);
  if (state.mapRegion !== 'all') params.set('region', state.mapRegion);
  if (state.mapFreeOnly) params.set('free', '1');
  if (state.sortMode === 'distance') params.set('sort', 'distance');
  if (state.mapListScrollTop > 0) params.set('scroll', String(Math.round(state.mapListScrollTop)));
  if (state.listOpen) params.set('list', 'open');
  if (typeof focusCultureId === 'number' && Number.isSafeInteger(focusCultureId) && focusCultureId > 0) {
    params.set('focus', String(focusCultureId));
  }
  if (typeof selectedCultureId === 'number' && Number.isSafeInteger(selectedCultureId) && selectedCultureId > 0) {
    params.set('selected', String(selectedCultureId));
  }

  return params.toString();
};

export const parseMapExploreStateFromSearch = (search: string): MapExploreUrlState | null => {
  const params = new URLSearchParams(search);
  const hasExploreState = ['q', 'category', 'region', 'free', 'sort', 'scroll', 'list', 'focus', 'selected'].some(key => params.has(key));

  if (!hasExploreState) {
    return null;
  }

  const parsedScrollTop = Number(params.get('scroll'));
  const parsedFocusCultureId = Number(params.get('focus'));
  const parsedSelectedCultureId = Number(params.get('selected'));
  const parsedCategory = params.get('category');
  const parsedSortMode = params.get('sort');

  return {
    searchQuery: params.get('q') ?? '',
    mapCategory: isCultureCategoryKey(parsedCategory) ? parsedCategory : 'all',
    mapRegion: params.get('region')?.trim() || 'all',
    mapFreeOnly: params.get('free') === '1',
    sortMode: isMapSortMode(parsedSortMode) ? parsedSortMode : 'date',
    mapListScrollTop: Number.isFinite(parsedScrollTop) && parsedScrollTop > 0 ? parsedScrollTop : 0,
    listOpen: params.get('list') === 'open',
    focusCultureId: Number.isSafeInteger(parsedFocusCultureId) && parsedFocusCultureId > 0 ? parsedFocusCultureId : null,
    selectedCultureId:
      Number.isSafeInteger(parsedSelectedCultureId) && parsedSelectedCultureId > 0 ? parsedSelectedCultureId : null,
  };
};

const LOCATION_STATUSES: LocationStatus[] = [
  'idle',
  'requesting',
  'success',
  'permission-denied',
  'timeout',
  'unavailable',
  'cancelled',
];

const isLocationStatus = (value: unknown): value is LocationStatus =>
  typeof value === 'string' && LOCATION_STATUSES.includes(value as LocationStatus);

export const getMapFilterSignature = (state: MapFilterState) =>
  JSON.stringify([
    state.searchQuery.trim(),
    state.mapCategory,
    state.mapRegion,
    state.mapFreeOnly,
    state.sortMode,
  ]);

export const getLocationStatus = (error: unknown): Exclude<LocationStatus, 'idle' | 'requesting' | 'success'> => {
  if (typeof error === 'object' && error !== null && 'status' in error && isLocationStatus(error.status)) {
    if (error.status === 'idle' || error.status === 'requesting' || error.status === 'success') {
      return 'unavailable';
    }

    return error.status;
  }

  if (typeof error === 'object' && error !== null && 'code' in error) {
    switch (error.code) {
      case 1:
        return 'permission-denied';
      case 3:
        return 'timeout';
      case 2:
        return 'unavailable';
      default:
        break;
    }
  }

  return 'unavailable';
};
