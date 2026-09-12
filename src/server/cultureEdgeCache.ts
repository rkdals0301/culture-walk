import { type CultureCacheBinding } from '@/cache/kv';

import { CULTURE_EDGE_CACHE_TAGS } from './httpCache';

export const CULTURE_PUBLIC_CACHE_TAGS = [
  CULTURE_EDGE_CACHE_TAGS.all,
  CULTURE_EDGE_CACHE_TAGS.list,
  CULTURE_EDGE_CACHE_TAGS.detail,
  CULTURE_EDGE_CACHE_TAGS.sitemap,
];

export interface CultureEdgeCacheContext {
  cache?: {
    purge?: (options: { tags: string[] }) => Promise<{ success?: boolean; errors?: unknown[] }>;
  };
  waitUntil?: (promise: Promise<unknown>) => void;
}

export const purgeCultureEdgeCache = async (
  ctx: CultureEdgeCacheContext | undefined,
  tags: string[],
  reason: string
) => {
  if (!ctx?.cache?.purge) {
    console.info(`[edge-cache] purge skipped reason=${reason} cache-api-unavailable`);
    return;
  }

  try {
    const result = await ctx.cache.purge({ tags });
    if (result?.success === false) {
      console.warn(`[edge-cache] purge failed reason=${reason}`, result.errors ?? []);
      return;
    }
    console.info(`[edge-cache] purge completed reason=${reason} tags=${tags.join(',')}`);
  } catch (error) {
    console.warn(`[edge-cache] purge failed reason=${reason}`, error);
  }
};

export const withSitemapEdgeCache = (response: Response) => {
  if (!response.ok) return response;

  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'public, max-age=300');
  headers.set(
    'Cloudflare-CDN-Cache-Control',
    'public, max-age=3600, stale-while-revalidate=86400, stale-if-error=86400'
  );
  headers.set('Cache-Tag', `${CULTURE_EDGE_CACHE_TAGS.all},${CULTURE_EDGE_CACHE_TAGS.sitemap}`);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export interface CultureWorkerEnv {
  DB?: unknown;
  CULTURE_CACHE?: CultureCacheBinding;
  TOUR_API_BASE_URL?: string;
  TOUR_API_KEY?: string;
}
