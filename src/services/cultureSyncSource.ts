import { TourApiFestival, TourApiFestivalIntro } from '@/types/culture';

import {
  INITIAL_PAGE_NUMBER,
  PAGE_SIZE,
  SOURCE_DETAIL_LIMIT,
  SOURCE_PAGE_CONCURRENCY,
  SOURCE_REQUEST_RETRY_LIMIT,
  TourApiConfig,
} from './cultureSyncTypes';

type TourApiResponse<T> = {
  response?: {
    header?: {
      resultCode?: string;
      resultMsg?: string;
    };
    body?: {
      items?: { item?: T[] | T } | string;
      totalCount?: number | string;
    };
  };
};

type TourApiPage<T> = {
  items: T[];
  totalCount: number;
};

const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

const asArray = <T>(value?: T[] | T) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const getKoreaApiDate = (date = new Date()) =>
  new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10).replaceAll('-', '');

const fetchTourApiPage = async <T>(
  config: TourApiConfig,
  path: string,
  params: Record<string, string | number | undefined>,
  retries = SOURCE_REQUEST_RETRY_LIMIT
): Promise<TourApiPage<T>> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const url = new URL(`${config.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`);
      url.searchParams.set('serviceKey', config.serviceKey);
      url.searchParams.set('MobileOS', 'ETC');
      url.searchParams.set('MobileApp', 'CultureWalk');
      url.searchParams.set('_type', 'json');

      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== '') {
          url.searchParams.set(key, String(value));
        }
      }

      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`TourAPI 요청 실패: HTTP ${response.status}`);
      }

      const payload = (await response.json()) as TourApiResponse<T>;
      const resultCode = payload.response?.header?.resultCode;
      if (resultCode !== '0000' && resultCode !== '0') {
        throw new Error(
          `TourAPI 응답 오류 ${resultCode ?? 'unknown'}: ${payload.response?.header?.resultMsg ?? '응답 형식 오류'}`
        );
      }

      const body = payload.response?.body;
      const item = typeof body?.items === 'object' ? body.items.item : undefined;
      const totalCount = Number(body?.totalCount ?? 0);
      if (!Number.isFinite(totalCount) || totalCount < 0) {
        throw new Error('TourAPI가 유효한 전체 건수를 반환하지 않았습니다.');
      }

      return { items: asArray(item), totalCount };
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await wait(250 * 2 ** attempt);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('TourAPI 요청에 실패했습니다.');
};

const enrichRelevantFestivals = async (config: TourApiConfig, festivals: TourApiFestival[]) => {
  const relevant = [...festivals]
    .sort((left, right) => left.eventstartdate.localeCompare(right.eventstartdate))
    .slice(0, SOURCE_DETAIL_LIMIT);
  const introByContentId = new Map<string, TourApiFestivalIntro>();

  for (let index = 0; index < relevant.length; index += SOURCE_PAGE_CONCURRENCY) {
    const chunk = relevant.slice(index, index + SOURCE_PAGE_CONCURRENCY);
    const results = await Promise.all(
      chunk.map(async festival => {
        try {
          const page = await fetchTourApiPage<TourApiFestivalIntro>(
            config,
            'detailIntro2',
            {
              contentId: festival.contentid,
              contentTypeId: festival.contenttypeid || '15',
              pageNo: 1,
              numOfRows: 1,
            },
            0
          );
          return { contentId: festival.contentid, intro: page.items[0] };
        } catch (error) {
          console.warn(`TourAPI 상세 조회를 건너뜁니다. contentid=${festival.contentid}`, error);
          return { contentId: festival.contentid, intro: undefined };
        }
      })
    );

    for (const result of results) {
      if (result.intro) {
        introByContentId.set(result.contentId, result.intro);
      }
    }
  }

  return festivals.map(festival => ({
    ...festival,
    intro: introByContentId.get(festival.contentid),
  }));
};

export const fetchCulturesFromTourApi = async (config: TourApiConfig, now = new Date()) => {
  const commonParams = {
    numOfRows: PAGE_SIZE,
    arrange: 'A',
    eventStartDate: getKoreaApiDate(now),
  };
  const firstPage = await fetchTourApiPage<TourApiFestival>(config, 'searchFestival2', {
    ...commonParams,
    pageNo: INITIAL_PAGE_NUMBER,
  });

  if (firstPage.totalCount <= 0 || firstPage.items.length === 0) {
    throw new Error('TourAPI에서 현재 또는 예정된 행사 데이터를 가져오지 못했습니다.');
  }

  const allFestivals = [...firstPage.items];
  const pageNumbers: number[] = [];
  const totalPages = Math.ceil(firstPage.totalCount / PAGE_SIZE);
  for (let pageNo = INITIAL_PAGE_NUMBER + 1; pageNo <= totalPages; pageNo += 1) {
    pageNumbers.push(pageNo);
  }

  for (let index = 0; index < pageNumbers.length; index += SOURCE_PAGE_CONCURRENCY) {
    const chunk = pageNumbers.slice(index, index + SOURCE_PAGE_CONCURRENCY);
    const pages = await Promise.all(
      chunk.map(pageNo =>
        fetchTourApiPage<TourApiFestival>(config, 'searchFestival2', { ...commonParams, pageNo })
      )
    );

    for (const page of pages) {
      if (page.totalCount !== firstPage.totalCount) {
        throw new Error('TourAPI 전체 건수가 페이지 조회 중 변경되었습니다.');
      }
      allFestivals.push(...page.items);
    }
  }

  if (allFestivals.length !== firstPage.totalCount) {
    throw new Error(
      `TourAPI 전체 건수와 수집 건수가 다릅니다. expected=${firstPage.totalCount}, received=${allFestivals.length}`
    );
  }

  return enrichRelevantFestivals(config, allFestivals);
};
