import { RawCulture } from '@/types/culture';
import axiosInstance from '@/utils/axiosInstance';

import { INITIAL_START_INDEX, PAGE_SIZE } from './cultureSyncTypes';

export const fetchCulturesFromSeoul = async (baseUrl: string) => {
  const allCultures: RawCulture[] = [];
  let startIndex = INITIAL_START_INDEX;
  let endIndex = PAGE_SIZE;

  const firstResponse = await axiosInstance.get(`${baseUrl}/${startIndex}/${endIndex}`);
  const totalDataCount = firstResponse.data?.culturalEventInfo?.list_total_count || 0;
  const firstCultures = firstResponse.data?.culturalEventInfo?.row || [];
  allCultures.push(...firstCultures);

  startIndex += PAGE_SIZE;
  endIndex += PAGE_SIZE;

  const requests = [];
  while (startIndex <= totalDataCount) {
    requests.push(axiosInstance.get(`${baseUrl}/${startIndex}/${endIndex}`));
    startIndex += PAGE_SIZE;
    endIndex += PAGE_SIZE;
  }

  const responses = await Promise.allSettled(requests);
  let failedRequestCount = 0;

  for (const result of responses) {
    if (result.status === 'fulfilled') {
      const rows = result.value?.data?.culturalEventInfo?.row || [];
      allCultures.push(...rows);
      continue;
    }

    failedRequestCount += 1;
    console.error('문화 API 요청 실패:', result.reason);
  }

  if (failedRequestCount > 0) {
    throw new Error(`문화 API 요청 ${failedRequestCount}건이 실패했습니다.`);
  }

  return allCultures;
};
