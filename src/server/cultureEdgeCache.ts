import { CULTURE_EDGE_CACHE_TAGS, createPublicEdgeCacheHeaders } from './httpCache';

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

const CULTURE_DOCUMENT_PATHS = new Set(['/', '/map']);
const CULTURE_DOCUMENT_METHODS = new Set(['GET', 'HEAD']);
const NEXT_FLIGHT_REQUEST_HEADERS = [
  'rsc',
  'next-router-state-tree',
  'next-router-prefetch',
  'next-router-segment-prefetch',
  'next-hmr-refresh',
] as const;

const CULTURE_DOCUMENT_CACHE_HEADERS = createPublicEdgeCacheHeaders({
  browserMaxAgeSeconds: 60,
  edgeMaxAgeSeconds: 60 * 10,
  staleWhileRevalidateSeconds: 60 * 30,
  staleIfErrorSeconds: 60 * 60 * 24,
  tags: [CULTURE_EDGE_CACHE_TAGS.all, CULTURE_EDGE_CACHE_TAGS.list],
});

const isNextFlightRequest = (request: Request, url: URL) =>
  url.searchParams.has('_rsc') || NEXT_FLIGHT_REQUEST_HEADERS.some(header => request.headers.has(header));

const addCacheHeaders = (response: Response, cacheHeaders: Record<string, string>) => {
  const headers = new Headers(response.headers);

  for (const [name, value] of Object.entries(cacheHeaders)) {
    headers.set(name, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

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

/**
 * Apply a shared public cache policy only to complete document requests for
 * the public landing pages. Next.js Flight/RSC responses use the same paths
 * but have different payloads and must never be stored as HTML.
 */
export const withCulturePageEdgeCache = (request: Request, response: Response) => {
  const url = new URL(request.url);
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';

  if (!CULTURE_DOCUMENT_METHODS.has(request.method)) return response;
  if (!CULTURE_DOCUMENT_PATHS.has(url.pathname)) return response;
  if (isNextFlightRequest(request, url)) return response;
  if (request.headers.has('authorization')) return response;
  if (response.status !== 200 || !contentType.startsWith('text/html')) return response;
  if (response.headers.has('set-cookie')) return response;

  return addCacheHeaders(response, CULTURE_DOCUMENT_CACHE_HEADERS);
};

export const withSitemapEdgeCache = (response: Response) => {
  if (!response.ok) return response;

  return addCacheHeaders(response, {
    'Cache-Control': 'public, max-age=300',
    'Cloudflare-CDN-Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400, stale-if-error=86400',
    'Cache-Tag': `${CULTURE_EDGE_CACHE_TAGS.all},${CULTURE_EDGE_CACHE_TAGS.sitemap}`,
  });
};
