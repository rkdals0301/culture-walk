/**
 * Public culture data is refreshed by scheduled sync jobs and those jobs purge
 * the matching Cloudflare cache tags after a successful publication. Keeping
 * the edge freshness window materially longer than the browser window reduces
 * repeat cold Worker/KV reads without making clients hold stale data locally.
 */
export const CULTURE_CACHE_POLICY = {
  document: {
    browserMaxAgeSeconds: 60,
    edgeMaxAgeSeconds: 60 * 60,
    staleWhileRevalidateSeconds: 60 * 60 * 6,
    staleIfErrorSeconds: 60 * 60 * 24,
  },
  list: {
    browserMaxAgeSeconds: 60,
    edgeMaxAgeSeconds: 60 * 60,
    staleWhileRevalidateSeconds: 60 * 60 * 6,
    staleIfErrorSeconds: 60 * 60 * 24,
  },
  feed: {
    browserMaxAgeSeconds: 30,
    edgeMaxAgeSeconds: 60 * 60,
    staleWhileRevalidateSeconds: 60 * 60 * 6,
    staleIfErrorSeconds: 60 * 60 * 24,
  },
  viewport: {
    browserMaxAgeSeconds: 30,
    edgeMaxAgeSeconds: 60 * 30,
    staleWhileRevalidateSeconds: 60 * 60 * 2,
    staleIfErrorSeconds: 60 * 60 * 6,
  },
  detail: {
    browserMaxAgeSeconds: 60,
    edgeMaxAgeSeconds: 60 * 60,
    staleWhileRevalidateSeconds: 60 * 60 * 6,
    staleIfErrorSeconds: 60 * 60 * 24,
  },
} as const;
