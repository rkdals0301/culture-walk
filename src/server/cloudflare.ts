import { getCloudflareContext } from '@opennextjs/cloudflare';

export interface WorkerEnv {
  APP_BASE_URL?: string;
  SITE_URL?: string;
  SEOUL_API_CULTURAL_URL?: string;
  NEXT_PUBLIC_KAKAO_MAPS_APP_KEY?: string;
  SYNC_TOKEN?: string;
  DB?: unknown;
  CULTURE_CACHE?: unknown;
}

export async function getOptionalCloudflareContext() {
  try {
    const context = await getCloudflareContext({ async: true });
    return context;
  } catch {
    return null;
  }
}

export async function getWorkerEnv(): Promise<WorkerEnv> {
  const context = await getOptionalCloudflareContext();

  const fallbackEnv: WorkerEnv = {
    APP_BASE_URL: process.env.APP_BASE_URL,
    SITE_URL: process.env.SITE_URL,
    SEOUL_API_CULTURAL_URL: process.env.SEOUL_API_CULTURAL_URL,
    NEXT_PUBLIC_KAKAO_MAPS_APP_KEY: process.env.NEXT_PUBLIC_KAKAO_MAPS_APP_KEY,
    SYNC_TOKEN: process.env.SYNC_TOKEN,
  };

  if (!context?.env) {
    return fallbackEnv;
  }

  const runtimeEnv = context.env as Record<string, unknown>;

  return {
    APP_BASE_URL: (runtimeEnv.APP_BASE_URL as string | undefined) ?? fallbackEnv.APP_BASE_URL,
    SITE_URL: (runtimeEnv.SITE_URL as string | undefined) ?? fallbackEnv.SITE_URL,
    SEOUL_API_CULTURAL_URL:
      (runtimeEnv.SEOUL_API_CULTURAL_URL as string | undefined) ?? fallbackEnv.SEOUL_API_CULTURAL_URL,
    NEXT_PUBLIC_KAKAO_MAPS_APP_KEY:
      (runtimeEnv.NEXT_PUBLIC_KAKAO_MAPS_APP_KEY as string | undefined) ?? fallbackEnv.NEXT_PUBLIC_KAKAO_MAPS_APP_KEY,
    SYNC_TOKEN: (runtimeEnv.SYNC_TOKEN as string | undefined) ?? fallbackEnv.SYNC_TOKEN,
    DB: runtimeEnv.DB,
    CULTURE_CACHE: runtimeEnv.CULTURE_CACHE,
  };
}
