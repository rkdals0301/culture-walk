export type D1AllResult = { results?: Array<Record<string, unknown>> };

export type D1Statement = {
  bind: (...values: unknown[]) => D1Statement;
  run: () => Promise<unknown>;
  all: () => Promise<D1AllResult>;
};

export type D1Binding = {
  prepare: (query: string) => D1Statement;
  batch: (statements: D1Statement[]) => Promise<unknown[]>;
};

export type CultureCacheBinding = {
  get: (key: string, type?: 'json') => Promise<unknown>;
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
};

/** Dependencies that application services receive from a runtime boundary. */
export interface RuntimeDeps {
  d1?: D1Binding;
  cache?: CultureCacheBinding;
}

/** Validated configuration and bindings exposed by the Cloudflare runtime. */
export interface RuntimeEnv {
  APP_BASE_URL?: string;
  SITE_URL?: string;
  TOUR_API_BASE_URL?: string;
  TOUR_API_KEY?: string;
  KAKAO_MAP_APP_KEY?: string;
  SYNC_TOKEN?: string;
  DB?: D1Binding;
  CULTURE_CACHE?: CultureCacheBinding;
}
