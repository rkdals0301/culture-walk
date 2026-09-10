export const CULTURE_EDGE_CACHE_TAGS = {
  all: 'culture-public-data',
  list: 'culture-list',
  detail: 'culture-detail',
  sitemap: 'culture-sitemap',
} as const;

export const NO_STORE_CACHE_HEADERS = {
  'Cache-Control': 'no-store',
  'Cloudflare-CDN-Cache-Control': 'no-store',
} as const;

interface PublicEdgeCacheHeadersOptions {
  browserMaxAgeSeconds: number;
  edgeMaxAgeSeconds: number;
  staleWhileRevalidateSeconds: number;
  staleIfErrorSeconds: number;
  source?: string;
  tags?: readonly string[];
}

const toSeconds = (value: number) => Math.max(0, Math.floor(value));

/**
 * Keep the browser cache conservative while allowing Workers Cache to serve a
 * longer-lived shared copy. Cloudflare's edge cache uses max-age rather than
 * s-maxage here so stale-while-revalidate and stale-if-error remain active.
 */
export const createPublicEdgeCacheHeaders = ({
  browserMaxAgeSeconds,
  edgeMaxAgeSeconds,
  staleWhileRevalidateSeconds,
  staleIfErrorSeconds,
  source,
  tags = [],
}: PublicEdgeCacheHeadersOptions) => ({
  'Cache-Control': `public, max-age=${toSeconds(browserMaxAgeSeconds)}`,
  'Cloudflare-CDN-Cache-Control': [
    'public',
    `max-age=${toSeconds(edgeMaxAgeSeconds)}`,
    `stale-while-revalidate=${toSeconds(staleWhileRevalidateSeconds)}`,
    `stale-if-error=${toSeconds(staleIfErrorSeconds)}`,
  ].join(', '),
  ...(source ? { 'X-Culture-Data-Source': source } : {}),
  ...(tags.length ? { 'Cache-Tag': tags.join(',') } : {}),
});
