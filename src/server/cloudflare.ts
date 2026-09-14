import { getCloudflareContext } from '@opennextjs/cloudflare';

import type {
  CultureCacheBinding,
  D1Binding,
  RuntimeDeps,
  RuntimeEnv,
} from './runtimeTypes';

export type { CultureCacheBinding, D1Binding, RuntimeDeps, RuntimeEnv } from './runtimeTypes';

const isLocalFallbackEnvironment = () => process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

const isString = (value: unknown): value is string => typeof value === 'string';

const isD1Binding = (value: unknown): value is D1Binding =>
  isRecord(value) && typeof value.prepare === 'function' && typeof value.batch === 'function';

const isCultureCacheBinding = (value: unknown): value is CultureCacheBinding =>
  isRecord(value) && typeof value.get === 'function' && typeof value.put === 'function';

const readOptionalString = (runtimeEnv: Record<string, unknown>, key: string, fallback?: string) => {
  const value = runtimeEnv[key];
  if (value === undefined || value === null) return fallback;
  if (isString(value)) return value;

  throw new Error(`Cloudflare runtime variable '${key}' must be a string`);
};

const readBinding = <T>(
  runtimeEnv: Record<string, unknown>,
  key: string,
  guard: (value: unknown) => value is T
): T | undefined => {
  const value = runtimeEnv[key];
  if (value === undefined || value === null) return undefined;
  if (guard(value)) return value;

  throw new Error(`Cloudflare runtime binding '${key}' is invalid`);
};

export async function getOptionalCloudflareContext() {
  try {
    const context = await getCloudflareContext({ async: true });
    return context;
  } catch (error) {
    if (isLocalFallbackEnvironment()) return null;

    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Cloudflare runtime context is unavailable: ${reason}`, { cause: error });
  }
}

const getFallbackEnv = (): RuntimeEnv => ({
  APP_BASE_URL: process.env.APP_BASE_URL,
  SITE_URL: process.env.SITE_URL,
  TOUR_API_BASE_URL: process.env.TOUR_API_BASE_URL,
  TOUR_API_KEY: process.env.TOUR_API_KEY,
  NEXT_PUBLIC_KAKAO_MAPS_APP_KEY: process.env.NEXT_PUBLIC_KAKAO_MAPS_APP_KEY,
  SYNC_TOKEN: process.env.SYNC_TOKEN,
});

const parseRuntimeEnv = (value: unknown, fallbackEnv: RuntimeEnv): RuntimeEnv => {
  const runtimeEnv = isRecord(value) ? value : {};

  return {
    APP_BASE_URL: readOptionalString(runtimeEnv, 'APP_BASE_URL', fallbackEnv.APP_BASE_URL),
    SITE_URL: readOptionalString(runtimeEnv, 'SITE_URL', fallbackEnv.SITE_URL),
    TOUR_API_BASE_URL: readOptionalString(runtimeEnv, 'TOUR_API_BASE_URL', fallbackEnv.TOUR_API_BASE_URL),
    TOUR_API_KEY: readOptionalString(runtimeEnv, 'TOUR_API_KEY', fallbackEnv.TOUR_API_KEY),
    NEXT_PUBLIC_KAKAO_MAPS_APP_KEY: readOptionalString(
      runtimeEnv,
      'NEXT_PUBLIC_KAKAO_MAPS_APP_KEY',
      fallbackEnv.NEXT_PUBLIC_KAKAO_MAPS_APP_KEY
    ),
    SYNC_TOKEN: readOptionalString(runtimeEnv, 'SYNC_TOKEN', fallbackEnv.SYNC_TOKEN),
    DB: readBinding(runtimeEnv, 'DB', isD1Binding),
    CULTURE_CACHE: readBinding(runtimeEnv, 'CULTURE_CACHE', isCultureCacheBinding),
  };
};

export async function getWorkerEnv(): Promise<RuntimeEnv> {
  const context = await getOptionalCloudflareContext();
  const fallbackEnv = getFallbackEnv();
  return context?.env ? parseRuntimeEnv(context.env, fallbackEnv) : fallbackEnv;
}

export const getRuntimeDeps = async (): Promise<RuntimeDeps> => {
  const env = await getWorkerEnv();
  return { d1: env.DB, cache: env.CULTURE_CACHE };
};
