import { RawCulture } from '@/types/culture';

const BASE_URL = 'http://openapi.seoul.go.kr:8088/684e537944726b643635534d756b47/json/culturalEventInfo';

export const fetchCultures = async () => {
  try {
    let allCultures: RawCulture[] = []; // 인터페이스 타입 적용
    const params = {
      startIndex: 1,
      endIndex: 1000,
    };
    let isData = true;

    while (isData) {
      const response = await fetch(`${BASE_URL}/${params.startIndex}/${params.endIndex}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cultures data');
      }

      const data = await response.json();
      const cultures = data?.culturalEventInfo?.row || [];
      if (cultures.length === 0) isData = false; // 데이터가 없으면 종료

      allCultures = [...allCultures, ...cultures];
      params.startIndex = params.startIndex + 1000;
      params.endIndex = params.endIndex + 1000;
    }

    // const cultureMap = new Map();
    // allCultures.forEach(item => cultureMap.set(item.id, item));

    return allCultures;
    // commit('SET_CULTURES', allCultures);
    // commit('SET_CULTURE_MAP', cultureMap);
    // commit('SET_FILTERED_CULTURES', allCultures);
  } catch (error) {
    console.error('Error fetching cultures:', error);
  } finally {
    // commit('SET_IS_LOADING', false);
  }
};
