import {
  CULTURE_EDGE_CACHE_TAGS,
  createPublicEdgeCacheHeaders,
  getCultureDetailEdgeCacheTag,
} from './httpCache';
import { CULTURE_CACHE_POLICY } from './cultureCachePolicy';

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
const CULTURE_DETAIL_DOCUMENT_PATTERN = /^\/(?:cultures|map)\/([1-9]\d*)$/;
const CULTURE_DOCUMENT_METHODS = new Set(['GET', 'HEAD']);
const NEXT_FLIGHT_REQUEST_HEADERS = [
  'rsc',
  'next-router-state-tree',
  'next-router-prefetch',
  'next-router-segment-prefetch',
  'next-hmr-refresh',
] as const;

const getCultureDocumentCacheHeaders = (pathname: string) => {
  const detailMatch = CULTURE_DETAIL_DOCUMENT_PATTERN.exec(pathname);
  if (detailMatch) {
    return createPublicEdgeCacheHeaders({
      ...CULTURE_CACHE_POLICY.document,
      tags: [
        CULTURE_EDGE_CACHE_TAGS.all,
        CULTURE_EDGE_CACHE_TAGS.detail,
        getCultureDetailEdgeCacheTag(detailMatch[1]),
      ],
    });
  }

  if (!CULTURE_DOCUMENT_PATHS.has(pathname)) return null;

  return createPublicEdgeCacheHeaders({
    ...CULTURE_CACHE_POLICY.document,
    tags: [CULTURE_EDGE_CACHE_TAGS.all, CULTURE_EDGE_CACHE_TAGS.list],
  });
};

const HASHED_STATIC_ASSET_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, immutable',
  'Cloudflare-CDN-Cache-Control': 'public, max-age=31536000, immutable',
} as const;

const OPTIMIZED_IMAGE_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=86400',
  'Cloudflare-CDN-Cache-Control':
    'public, max-age=86400, stale-while-revalidate=604800, stale-if-error=2592000',
} as const;

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
  const cacheHeaders = getCultureDocumentCacheHeaders(url.pathname);
  if (!cacheHeaders) return response;
  if (isNextFlightRequest(request, url)) return response;
  if (request.headers.has('authorization')) return response;
  if (response.status !== 200 || !contentType.startsWith('text/html')) return response;
  if (response.headers.has('set-cookie')) return response;

  return addCacheHeaders(response, cacheHeaders);
};

/**
 * Next's build output is content-addressed under /_next/static. Cache those
 * assets for a year so repeat navigations do not revalidate CSS and JS on
 * every request. New deployments produce new hashed URLs, so immutable is
 * safe here.
 */
export const withStaticAssetEdgeCache = (request: Request, response: Response) => {
  const url = new URL(request.url);

  if (request.method !== 'GET' && request.method !== 'HEAD') return response;
  if (!url.pathname.startsWith('/_next/static/')) return response;
  if (response.status !== 200 && response.status !== 304) return response;
  if (response.headers.has('set-cookie')) return response;

  return addCacheHeaders(response, HASHED_STATIC_ASSET_CACHE_HEADERS);
};

/**
 * Optimized images are keyed by source URL, width, quality, and format. Keep
 * the generated variant reusable for a day, matching the scheduled event
 * refresh cadence while allowing a changed source URL to invalidate it.
 */
export const withOptimizedImageEdgeCache = (request: Request, response: Response) => {
  const url = new URL(request.url);
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';

  if (request.method !== 'GET' && request.method !== 'HEAD') return response;
  if (url.pathname !== '/_next/image') return response;
  if (response.status !== 200 && response.status !== 304) return response;
  if (!contentType.startsWith('image/')) return response;
  if (response.headers.has('set-cookie')) return response;

  return addCacheHeaders(response, OPTIMIZED_IMAGE_CACHE_HEADERS);
};

export const withSitemapEdgeCache = (response: Response) => {
  if (!response.ok) return response;

  return addCacheHeaders(response, {
    'Cache-Control': 'public, max-age=300',
    'Cloudflare-CDN-Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400, stale-if-error=86400',
    'Cache-Tag': `${CULTURE_EDGE_CACHE_TAGS.all},${CULTURE_EDGE_CACHE_TAGS.sitemap}`,
  });
};
