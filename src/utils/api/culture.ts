import { RawCulture } from '@/types/culture';

const BASE_URL = '/api/684e537944726b643635534d756b47/json/culturalEventInfo';
const INITIAL_START_INDEX = 1;
const PAGE_SIZE = 1000;

export const fetchCultures = async (): Promise<RawCulture[]> => {
  const allCultures: RawCulture[] = [];
  let startIndex = INITIAL_START_INDEX;
  let endIndex = PAGE_SIZE;
  let totalDataCount = 0;

  try {
    // 첫 번째 요청으로 전체 데이터 수 확인
    const firstResponse = await fetch(`${BASE_URL}/${startIndex}/${endIndex}`);
    if (!firstResponse.ok) {
      throw new Error('Failed to fetch initial cultures data');
    }

    const firstData = await firstResponse.json();
    totalDataCount = firstData?.culturalEventInfo?.list_total_count || 0; // 전체 데이터 수
    const firstCultures = firstData?.culturalEventInfo?.row || [];
    allCultures.push(...firstCultures); // 첫 번째 데이터를 누적
    startIndex += PAGE_SIZE;
    endIndex += PAGE_SIZE;

    // 총 데이터를 기반으로 다음 요청 리스트 생성
    const requests = [];
    while (startIndex <= totalDataCount) {
      requests.push(
        fetch(`${BASE_URL}/${startIndex}/${endIndex}`).then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch cultures data');
          }
          return response.json();
        })
      );
      startIndex += PAGE_SIZE;
      endIndex += PAGE_SIZE;
    }

    // 모든 요청을 병렬로 처리
    const responses = await Promise.all(requests);

    // 응답 데이터를 누적
    for (const data of responses) {
      const cultures = data?.culturalEventInfo?.row || [];
      allCultures.push(...cultures);
    }
  } catch (error) {
    console.error('Error fetching cultures:', error);
  }

  return allCultures;
};
