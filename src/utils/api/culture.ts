import { RawCulture } from '@/types/culture';

const BASE_URL = '/api/684e537944726b643635534d756b47/json/culturalEventInfo';
const INITIAL_START_INDEX = 1;
const INITIAL_END_INDEX = 1000;
const PAGE_SIZE = 1000;

export const fetchCultures = async () => {
  const allCultures: RawCulture[] = []; // 인터페이스 타입 적용
  let startIndex = INITIAL_START_INDEX;
  let endIndex = INITIAL_END_INDEX;
  let hasMoreData = true;

  while (hasMoreData) {
    try {
      const response = await fetch(`${BASE_URL}/${startIndex}/${endIndex}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cultures data');
      }

      const data = await response.json();
      const cultures = data?.culturalEventInfo?.row || [];
      if (cultures.length === 0) {
        hasMoreData = false;
      } else {
        allCultures.push(...cultures);
        startIndex += PAGE_SIZE;
        endIndex += PAGE_SIZE;
      }
    } catch (error) {
      console.error('Error fetching cultures:', error);
    }
  }

  return allCultures;
};
