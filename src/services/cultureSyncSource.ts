import { RawCulture } from '@/types/culture';
import axiosInstance from '@/utils/axiosInstance';

import {
  INITIAL_START_INDEX,
  PAGE_SIZE,
  SOURCE_PAGE_CONCURRENCY,
  SOURCE_REQUEST_RETRY_LIMIT,
} from './cultureSyncTypes';

type CulturePage = {
  rows: RawCulture[];
  totalCount: number;
};

const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

const fetchCulturePage = async (baseUrl: string, startIndex: number, endIndex: number): Promise<CulturePage> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= SOURCE_REQUEST_RETRY_LIMIT; attempt += 1) {
    try {
      const response = await axiosInstance.get(`${baseUrl}/${startIndex}/${endIndex}`);
      const payload = response.data?.culturalEventInfo;
      const totalCount = Number(payload?.list_total_count ?? 0);
      const rows = Array.isArray(payload?.row) ? (payload.row as RawCulture[]) : [];

      if (!Number.isFinite(totalCount) || totalCount <= 0) {
        throw new Error('문화 API가 유효한 전체 건수를 반환하지 않았습니다.');
      }

      return { rows, totalCount };
    } catch (error) {
      lastError = error;
      if (attempt < SOURCE_REQUEST_RETRY_LIMIT) {
        await wait(250 * 2 ** attempt);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('문화 API 요청에 실패했습니다.');
};

export const fetchCulturesFromSeoul = async (baseUrl: string) => {
  const firstPage = await fetchCulturePage(baseUrl, INITIAL_START_INDEX, PAGE_SIZE);
  const allCultures = [...firstPage.rows];
  const ranges: Array<{ startIndex: number; endIndex: number }> = [];

  for (let startIndex = INITIAL_START_INDEX + PAGE_SIZE; startIndex <= firstPage.totalCount; startIndex += PAGE_SIZE) {
    ranges.push({ startIndex, endIndex: startIndex + PAGE_SIZE - 1 });
  }

  for (let index = 0; index < ranges.length; index += SOURCE_PAGE_CONCURRENCY) {
    const chunk = ranges.slice(index, index + SOURCE_PAGE_CONCURRENCY);
    const pages = await Promise.all(
      chunk.map(range => fetchCulturePage(baseUrl, range.startIndex, range.endIndex))
    );

    for (const page of pages) {
      if (page.totalCount !== firstPage.totalCount) {
        throw new Error('문화 API 전체 건수가 페이지 조회 중 변경되었습니다.');
      }
      allCultures.push(...page.rows);
    }
  }

  if (allCultures.length !== firstPage.totalCount) {
    throw new Error(
      `문화 API 전체 건수와 수집 건수가 다릅니다. expected=${firstPage.totalCount}, received=${allCultures.length}`
    );
  }

  return allCultures;
};
