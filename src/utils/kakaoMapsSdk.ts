export const KAKAO_MAPS_SCRIPT_ID = 'kakao-maps-sdk';

export type KakaoMapsSdkErrorCode = 'missing-key' | 'invalid-key' | 'network' | 'timeout' | 'sdk-error';

const DEFAULT_TIMEOUT_MS = 12_000;
const APP_KEY_PATTERN = /^[a-z0-9]{32}$/i;

const ERROR_MESSAGES: Record<KakaoMapsSdkErrorCode, string> = {
  'missing-key': 'Kakao Maps 앱 키가 설정되지 않았습니다.',
  'invalid-key': 'Kakao Maps 앱 키 형식이 올바르지 않습니다.',
  network: 'Kakao Maps SDK 네트워크 요청에 실패했습니다.',
  timeout: 'Kakao Maps SDK 응답 시간이 초과되었습니다.',
  'sdk-error': 'Kakao Maps SDK를 초기화하지 못했습니다.',
};

export class KakaoMapsSdkError extends Error {
  readonly code: KakaoMapsSdkErrorCode;

  constructor(code: KakaoMapsSdkErrorCode, cause?: unknown) {
    super(ERROR_MESSAGES[code], { cause });
    this.name = 'KakaoMapsSdkError';
    this.code = code;
  }
}

interface LoaderOptions {
  timeoutMs?: number;
}

let sdkPromise: Promise<void> | null = null;
let sdkAppKey: string | null = null;

const isKakaoMapsReady = () =>
  typeof window !== 'undefined' &&
  Boolean(window.kakao?.maps) &&
  typeof window.kakao?.maps.load === 'function';

const getTimeoutMs = (timeoutMs?: number) =>
  typeof timeoutMs === 'number' && Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS;

const removeSdkScript = () => {
  if (typeof document === 'undefined') {
    return;
  }

  const script = document.getElementById(KAKAO_MAPS_SCRIPT_ID);
  if (!script) {
    return;
  }

  script.remove();
};

const waitForKakaoMaps = (timeoutMs: number) =>
  new Promise<void>((resolve, reject) => {
    if (!isKakaoMapsReady()) {
      reject(new KakaoMapsSdkError('sdk-error'));
      return;
    }

    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      reject(new KakaoMapsSdkError('timeout'));
    }, timeoutMs);

    const settle = (error?: KakaoMapsSdkError) => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeoutId);
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };

    try {
      window.kakao?.maps.load(() => settle());
    } catch (error) {
      settle(new KakaoMapsSdkError('sdk-error', error));
    }
  });

const loadScript = (appKey: string, timeoutMs: number) =>
  new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(new KakaoMapsSdkError('sdk-error'));
      return;
    }

    const expectedSrc = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false&libraries=clusterer`;
    let script = document.getElementById(KAKAO_MAPS_SCRIPT_ID) as HTMLScriptElement | null;

    if (script && script.src !== expectedSrc) {
      script.remove();
      script = null;
    }

    if (!script) {
      script = document.createElement('script');
      script.id = KAKAO_MAPS_SCRIPT_ID;
      script.src = expectedSrc;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      script?.removeEventListener('load', handleLoad);
      script?.removeEventListener('error', handleError);
      reject(new KakaoMapsSdkError('timeout'));
    }, timeoutMs);

    const settle = (error?: KakaoMapsSdkError) => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeoutId);
      script?.removeEventListener('load', handleLoad);
      script?.removeEventListener('error', handleError);
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };

    const handleLoad = () => settle();
    const handleError = () => settle(new KakaoMapsSdkError('network'));

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
  });

const loadSdk = async (appKey: string, timeoutMs: number) => {
  if (isKakaoMapsReady()) {
    await waitForKakaoMaps(timeoutMs);
    return;
  }

  await loadScript(appKey, timeoutMs);

  if (!isKakaoMapsReady()) {
    throw new KakaoMapsSdkError('sdk-error');
  }

  await waitForKakaoMaps(timeoutMs);
};

export const loadKakaoMapsSdk = (appKey: string | undefined | null, options: LoaderOptions = {}) => {
  const normalizedAppKey = appKey?.trim() ?? '';
  if (!normalizedAppKey) {
    return Promise.reject(new KakaoMapsSdkError('missing-key'));
  }

  if (!APP_KEY_PATTERN.test(normalizedAppKey)) {
    return Promise.reject(new KakaoMapsSdkError('invalid-key'));
  }

  if (sdkPromise) {
    if (sdkAppKey === normalizedAppKey) {
      return sdkPromise;
    }

    return Promise.reject(new KakaoMapsSdkError('sdk-error'));
  }

  sdkAppKey = normalizedAppKey;
  sdkPromise = loadSdk(normalizedAppKey, getTimeoutMs(options.timeoutMs)).catch(error => {
    sdkPromise = null;
    sdkAppKey = null;
    removeSdkScript();
    throw error instanceof KakaoMapsSdkError ? error : new KakaoMapsSdkError('sdk-error', error);
  });

  return sdkPromise;
};

export const resetKakaoMapsSdk = () => {
  sdkPromise = null;
  sdkAppKey = null;
  removeSdkScript();
};
