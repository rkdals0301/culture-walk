import type { FormattedCultureListItem } from '@/types/culture';
import type { CultureCategoryKey } from '@/utils/cultureCategory';
import type { MapSortMode } from '@/utils/exploreState';
import type { GeoPoint } from '@/utils/geo';

export interface MapDashboardViewModel {
  filters: {
    activeFilterLabels: string[];
    category: CultureCategoryKey;
    currentLocation: GeoPoint | null;
    filterMotionKey: string;
    freeOnly: boolean;
    hasActiveFilters: boolean;
    isFilterPending: boolean;
    isLocating: boolean;
    region: string;
    regionOptions: string[];
    searchQuery: string;
    sortMode: MapSortMode;
  };
  list: {
    cultures: FormattedCultureListItem[];
    error: Error | null;
    focusCultureId: number | null;
    isClustered: boolean;
    isLoading: boolean;
    scrollTop: number;
    selectedCultureId: number | null;
    totalCount: number;
    viewportCount: number;
  };
  actions: {
    onCategoryChange: (category: CultureCategoryKey) => void;
    onFocusCultureHandled: () => void;
    onFreeOnlyChange: (freeOnly: boolean) => void;
    onLocationToggle: () => void;
    onOpenCulture: (culture: FormattedCultureListItem) => void;
    onRegionChange: (region: string) => void;
    onResetFilters: () => void;
    onRetry: () => void;
    onScrollPositionChange: (scrollTop: number) => void;
    onSearchChange: (query: string) => void;
    onSortChange: (mode: MapSortMode) => void;
  };
}
