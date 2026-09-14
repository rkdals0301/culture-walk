type ApiQueryValue = string | number | boolean | null | undefined;

interface ApiRequestOptions {
  params?: Record<string, ApiQueryValue>;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export class ApiRequestError extends Error {
  readonly status: number | null;
  readonly data: unknown;
  readonly isNetworkError: boolean;

  constructor(
    message: string,
    options: { status?: number | null; data?: unknown; isNetworkError?: boolean; cause?: unknown } = {}
  ) {
    super(message, { cause: options.cause });
    this.name = 'ApiRequestError';
    this.status = options.status ?? null;
    this.data = options.data;
    this.isNetworkError = options.isNetworkError ?? false;
  }
}

export const isRequestAbortError = (error: unknown) =>
  (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError') ||
  (error instanceof Error && error.name === 'AbortError');

const buildRequestUrl = (url: string, params?: Record<string, ApiQueryValue>) => {
  if (!params) return url;

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) searchParams.set(key, String(value));
  });
  const search = searchParams.toString();
  return search ? `${url}?${search}` : url;
};

const parseResponseBody = async (response: Response) => {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json().catch(() => null);
  }
  return response.text().catch(() => '');
};

export const getJson = async <T>(url: string, options: ApiRequestOptions = {}): Promise<T> => {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 10_000;
  let timedOut = false;
  const handleExternalAbort = () => controller.abort(options.signal?.reason);

  if (options.signal?.aborted) {
    controller.abort(options.signal.reason);
  } else {
    options.signal?.addEventListener('abort', handleExternalAbort, { once: true });
  }

  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(buildRequestUrl(url, options.params), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    const data = await parseResponseBody(response);
    if (!response.ok) {
      throw new ApiRequestError(`HTTP ${response.status}`, { status: response.status, data });
    }
    return data as T;
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    if (timedOut) {
      throw new ApiRequestError('요청 시간이 초과되었습니다.', { isNetworkError: true, cause: error });
    }
    if (isRequestAbortError(error) || options.signal?.aborted) throw error;
    throw new ApiRequestError('서버 연결이 원활하지 않습니다.', { isNetworkError: true, cause: error });
  } finally {
    window.clearTimeout(timeoutId);
    options.signal?.removeEventListener('abort', handleExternalAbort);
  }
};
