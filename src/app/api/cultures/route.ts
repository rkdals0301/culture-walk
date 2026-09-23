import { getCulturePublicListSnapshot } from '@/services/cultureList';
import {
  CULTURE_EDGE_CACHE_TAGS,
  createPublicEdgeCacheHeaders,
  NO_STORE_CACHE_HEADERS,
} from '@/server/httpCache';
import { CULTURE_CACHE_POLICY } from '@/server/cultureCachePolicy';
import { getRuntimeDeps } from '@/server/cloudflare';
import {
  logPublicRequestObservation,
  resolveRequestCorrelation,
} from '@/server/requestTrace';
import { CultureListItem } from '@/types/culture';
import { toCultureListItemDtos } from '@/services/culturePublicDto';

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const listResponse = (data: CultureListItem[], source?: string) =>
  NextResponse.json(toCultureListItemDtos(data), {
    headers: createPublicEdgeCacheHeaders({
      ...CULTURE_CACHE_POLICY.list,
      source,
      tags: [CULTURE_EDGE_CACHE_TAGS.all, CULTURE_EDGE_CACHE_TAGS.list],
    }),
  });

export async function GET(request: Request) {
  const requestStartedAt = performance.now();
  const correlation = resolveRequestCorrelation(request);
  const snapshot = await getCulturePublicListSnapshot(await getRuntimeDeps());
  if (!snapshot) {
    logPublicRequestObservation({
      correlation,
      route: 'GET /api/cultures',
      status: 503,
      durationMs: performance.now() - requestStartedAt,
      dataSource: 'kv-read-model-missing',
    });
    return NextResponse.json(
      { error: '문화 목록 read model이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.' },
      {
        status: 503,
        headers: { ...NO_STORE_CACHE_HEADERS, 'X-Culture-Data-Source': 'kv-read-model-missing' },
      }
    );
  }

  logPublicRequestObservation({
    correlation,
    route: 'GET /api/cultures',
    status: 200,
    durationMs: performance.now() - requestStartedAt,
    dataSource: snapshot.source,
  });
  return listResponse(snapshot.items, snapshot.source);
}
