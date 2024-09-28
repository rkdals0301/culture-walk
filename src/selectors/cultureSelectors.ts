import { createSelector } from 'reselect';
import { RootState } from '@/store';
import { FormattedCulture } from '@/types/culture';

// 전체 문화 데이터를 가져오는 셀렉터
export const getCultures = (state: RootState): FormattedCulture[] => state.culture.cultures;

// 필터링된 문화 데이터를 가져오는 셀렉터
export const getFilteredCultures = createSelector(
  [getCultures, (state: RootState) => state.culture.searchQuery],
  (cultures: FormattedCulture[], searchQuery: string) => {
    const query = searchQuery.toLowerCase();
    return cultures.filter(culture => culture.title.toLowerCase().includes(query));
  }
);

// 특정 문화 데이터를 가져오는 셀렉터
export const getCulture = (state: RootState): FormattedCulture | null => state.culture.culture;

// 검색어를 가져오는 셀렉터
export const getSearchQuery = (state: RootState): string => state.culture.searchQuery;
