import {
  TourApiFestival,
  TourApiFestivalCommon,
  TourApiFestivalDetails,
  TourApiFestivalImage,
  TourApiFestivalInfo,
  TourApiFestivalIntro,
} from '@/types/culture';

import {
  INITIAL_PAGE_NUMBER,
  PAGE_SIZE,
  SOURCE_DETAIL_DEADLINE_MS,
  SOURCE_PAGE_CONCURRENCY,
  SOURCE_REQUEST_TIMEOUT_MS,
  SOURCE_RETRY_BACKOFF_BASE_MS,
  SOURCE_REQUEST_RETRY_LIMIT,
  SOURCE_SNAPSHOT_DEADLINE_MS,
  TourApiRequestOptions,
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

export class TourApiDeadlineExceededError extends Error {
  constructor(operation: string) {
    super(`TourAPI ${operation} deadline을 초과했습니다.`);
    this.name = 'TourApiDeadlineExceededError';
  }
}

class TourApiRequestTimeoutError extends Error {
  constructor(path: string, timeoutMs: number) {
    super(`TourAPI 요청 시간이 초과되었습니다. path=${path}, timeoutMs=${timeoutMs}`);
    this.name = 'TourApiRequestTimeoutError';
  }
}

export const isTourApiDeadlineExceededError = (error: unknown): error is TourApiDeadlineExceededError =>
  error instanceof TourApiDeadlineExceededError ||
  (error instanceof Error && error.name === 'TourApiDeadlineExceededError');

const resolveDeadlineAt = (deadlineAt: number | undefined, defaultDurationMs: number) =>
  Number.isFinite(deadlineAt) ? Number(deadlineAt) : Date.now() + defaultDurationMs;

const ensureDeadline = (deadlineAt: number, operation: string) => {
  if (Date.now() >= deadlineAt) {
    throw new TourApiDeadlineExceededError(operation);
  }
};

const waitBeforeRetry = async (milliseconds: number, deadlineAt: number, operation: string) => {
  ensureDeadline(deadlineAt, operation);
  if (Date.now() + milliseconds >= deadlineAt) {
    throw new TourApiDeadlineExceededError(operation);
  }
  await wait(milliseconds);
  ensureDeadline(deadlineAt, operation);
};

const fetchWithTimeout = async <T>(
  url: URL,
  path: string,
  deadlineAt: number,
  requestTimeoutMs: number,
  readResponse: (response: Response) => Promise<T>
): Promise<T> => {
  ensureDeadline(deadlineAt, path);

  const remainingMs = deadlineAt - Date.now();
  const timeoutMs = Math.max(1, Math.min(requestTimeoutMs, remainingMs));
  const controller = new AbortController();
  let timedOut = false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
      reject(new Error('TourAPI request timeout'));
    }, timeoutMs);
  });

  try {
    const responsePromise = Promise.resolve()
      .then(() => fetch(url, { cache: 'no-store', signal: controller.signal }))
      .then(readResponse);
    return await Promise.race([responsePromise, timeoutPromise]);
  } catch (error) {
    if (timedOut) {
      if (Date.now() >= deadlineAt) {
        throw new TourApiDeadlineExceededError(path);
      }
      throw new TourApiRequestTimeoutError(path, timeoutMs);
    }
    throw error;
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
};

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
  retries = SOURCE_REQUEST_RETRY_LIMIT,
  options: TourApiRequestOptions = {},
): Promise<TourApiPage<T>> => {
  const deadlineAt = resolveDeadlineAt(options.deadlineAt, SOURCE_SNAPSHOT_DEADLINE_MS);
  const requestTimeoutMs = Number.isFinite(options.requestTimeoutMs)
    ? Math.max(1, Number(options.requestTimeoutMs))
    : SOURCE_REQUEST_TIMEOUT_MS;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      ensureDeadline(deadlineAt, path);
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

      const result = await fetchWithTimeout(url, path, deadlineAt, requestTimeoutMs, async response => {
        if (!response.ok) return { response, payload: null };
        return { response, payload: (await response.json()) as TourApiResponse<T> };
      });
      const response = result.response;
      if (!response.ok) {
        throw new Error(`TourAPI 요청 실패: HTTP ${response.status}`);
      }

      if (!result.payload) {
        throw new Error('TourAPI 응답 본문이 없습니다.');
      }
      const payload = result.payload;
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

      ensureDeadline(deadlineAt, path);
      return { items: asArray(item), totalCount };
    } catch (error) {
      lastError = error;
      if (isTourApiDeadlineExceededError(error)) {
        throw error;
      }
      if (attempt < retries) {
        await waitBeforeRetry(SOURCE_RETRY_BACKOFF_BASE_MS * 2 ** attempt, deadlineAt, path);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('TourAPI 요청에 실패했습니다.');
};

export const fetchTourApiFestivalDetails = async (
  config: TourApiConfig,
  contentId: string,
  contentTypeIdOrOptions: string | TourApiRequestOptions = '15',
  options: TourApiRequestOptions = {}
): Promise<TourApiFestivalDetails> => {
  const contentTypeId = typeof contentTypeIdOrOptions === 'string' ? contentTypeIdOrOptions : '15';
  const configuredOptions = typeof contentTypeIdOrOptions === 'string' ? options : contentTypeIdOrOptions;
  const deadlineAt = resolveDeadlineAt(configuredOptions.deadlineAt, SOURCE_DETAIL_DEADLINE_MS);
  const requestOptions = { ...configuredOptions, deadlineAt };
  const requests = await Promise.allSettled([
    fetchTourApiPage<TourApiFestivalCommon>(
      config,
      'detailCommon2',
      { contentId, pageNo: 1, numOfRows: 1 },
      1,
      requestOptions
    ),
    fetchTourApiPage<TourApiFestivalIntro>(
      config,
      'detailIntro2',
      { contentId, contentTypeId, pageNo: 1, numOfRows: 1 },
      1,
      requestOptions
    ),
    fetchTourApiPage<TourApiFestivalInfo>(
      config,
      'detailInfo2',
      { contentId, contentTypeId, pageNo: 1, numOfRows: 100 },
      1,
      requestOptions
    ),
    fetchTourApiPage<TourApiFestivalImage>(
      config,
      'detailImage2',
      { contentId, pageNo: 1, numOfRows: 100, imageYN: 'Y' },
      1,
      requestOptions
    ),
  ]);

  const deadlineFailure = requests.find(
    result => result.status === 'rejected' && isTourApiDeadlineExceededError(result.reason)
  );
  if (deadlineFailure?.status === 'rejected') {
    throw deadlineFailure.reason;
  }
  ensureDeadline(deadlineAt, 'detail');

  const failedCount = requests.filter(result => result.status === 'rejected').length;
  if (failedCount === requests.length) {
    throw new Error(`TourAPI 상세정보 전체 조회에 실패했습니다. contentid=${contentId}`);
  }

  if (failedCount > 0) {
    console.warn(`TourAPI 상세정보 일부 조회 실패: contentid=${contentId}, failed=${failedCount}`);
  }

  const pageItems = <T>(index: number): T[] => {
    const result = requests[index];
    return result?.status === 'fulfilled' ? (result.value.items as T[]) : [];
  };

  return {
    common: pageItems<TourApiFestivalCommon>(0)[0],
    intro: pageItems<TourApiFestivalIntro>(1)[0],
    info: pageItems<TourApiFestivalInfo>(2),
    images: pageItems<TourApiFestivalImage>(3),
    complete: failedCount === 0,
  };
};

export const fetchCulturesFromTourApi = async (
  config: TourApiConfig,
  now = new Date(),
  options: TourApiRequestOptions = {}
) => {
  const deadlineAt = resolveDeadlineAt(options.deadlineAt, SOURCE_SNAPSHOT_DEADLINE_MS);
  const requestOptions = { ...options, deadlineAt };
  const commonParams = {
    numOfRows: PAGE_SIZE,
    arrange: 'A',
    eventStartDate: getKoreaApiDate(now),
  };
  const firstPage = await fetchTourApiPage<TourApiFestival>(
    config,
    'searchFestival2',
    { ...commonParams, pageNo: INITIAL_PAGE_NUMBER },
    SOURCE_REQUEST_RETRY_LIMIT,
    requestOptions
  );

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
    ensureDeadline(deadlineAt, 'snapshot');
    const chunk = pageNumbers.slice(index, index + SOURCE_PAGE_CONCURRENCY);
    const pages = await Promise.all(
      chunk.map(pageNo =>
        fetchTourApiPage<TourApiFestival>(
          config,
          'searchFestival2',
          { ...commonParams, pageNo },
          SOURCE_REQUEST_RETRY_LIMIT,
          requestOptions
        )
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

  return allFestivals;
};
