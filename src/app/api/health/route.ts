import { getRuntimeDeps } from '@/server/cloudflare';
import { CULTURE_EDGE_CACHE_TAGS } from '@/server/httpCache';
import { getPublicHealthReport } from '@/server/publicHealth';
import { logPublicRequestObservation, resolveRequestCorrelation } from '@/server/requestTrace';
import { createServerTimingHeader } from '@/server/serverTiming';

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Public health is deliberately read-model-only. A health probe must never be
 * capable of exhausting the D1 row-read budget it is supposed to observe.
 * Deep database diagnostics belong in scheduled sync logs / Cloudflare tools.
 */
export async function GET(request: Request) {
  const requestStartedAt = performance.now();
  const correlation = resolveRequestCorrelation(request);
  const report = await getPublicHealthReport(await getRuntimeDeps());
  const durationMs = performance.now() - requestStartedAt;

  logPublicRequestObservation({
    correlation,
    route: 'GET /api/health',
    status: report.httpStatus,
    durationMs,
    dataSource: report.dataSource,
  });

  const responseHeaders: Record<string, string> = {
    'Cache-Control': 'no-store',
    'Cloudflare-CDN-Cache-Control': 'no-store',
    'X-Culture-Data-Source': report.dataSource,
    'Server-Timing': createServerTimingHeader([
      {
        name: 'health-meta',
        durationMs: report.metadataReadDurationMs,
        description: report.dataSource,
      },
      { name: 'total', durationMs },
    ]),
  };

  if (report.httpStatus === 200) {
    responseHeaders['Cloudflare-CDN-Cache-Control'] =
      'public, max-age=30, stale-while-revalidate=30, stale-if-error=60';
    responseHeaders['Cache-Tag'] = CULTURE_EDGE_CACHE_TAGS.all + ',' + CULTURE_EDGE_CACHE_TAGS.list;
  }

  return NextResponse.json(report.body, {
    status: report.httpStatus,
    headers: responseHeaders,
  });
}
