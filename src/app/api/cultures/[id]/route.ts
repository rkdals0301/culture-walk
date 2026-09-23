import { getCulturePublicRead } from '@/services/cultureReadModel';
import { getRuntimeDeps } from '@/server/cloudflare';
import {
  CULTURE_EDGE_CACHE_TAGS,
  createPublicEdgeCacheHeaders,
  getCultureDetailEdgeCacheTag,
  NO_STORE_CACHE_HEADERS,
} from '@/server/httpCache';
import { CULTURE_CACHE_POLICY } from '@/server/cultureCachePolicy';
import {
  logPublicRequestObservation,
  resolveRequestCorrelation,
} from '@/server/requestTrace';
import { withServerTiming } from '@/server/serverTiming';

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const responseHeaders = (source: string, id: string) =>
  createPublicEdgeCacheHeaders({
    ...CULTURE_CACHE_POLICY.detail,
    source,
    tags: [CULTURE_EDGE_CACHE_TAGS.all, CULTURE_EDGE_CACHE_TAGS.detail, getCultureDetailEdgeCacheTag(id)],
  });

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestStartedAt = performance.now();
  const correlation = resolveRequestCorrelation(request);
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: 'ID 파라미터가 필요합니다.' },
      { status: 400, headers: NO_STORE_CACHE_HEADERS }
    );
  }

  if (!/^[1-9]\d*$/.test(id)) {
    return NextResponse.json(
      { error: '유효하지 않은 ID 파라미터입니다.' },
      { status: 400, headers: NO_STORE_CACHE_HEADERS }
    );
  }

  const readStartedAt = performance.now();
  const result = await getCulturePublicRead(Number(id), await getRuntimeDeps());
  const readDurationMs = performance.now() - readStartedAt;
  if (result.culture) {
    const durationMs = performance.now() - requestStartedAt;
    logPublicRequestObservation({
      correlation,
      route: 'GET /api/cultures/:id',
      status: 200,
      durationMs,
      dataSource: result.source,
    });
    return NextResponse.json(result.culture, {
      headers: withServerTiming(responseHeaders(result.source ?? 'kv-read-model', id), [
        { name: 'detail-read', durationMs: readDurationMs, description: result.source ?? 'unknown' },
        { name: 'total', durationMs: performance.now() - requestStartedAt },
      ]),
    });
  }

  if (!result.readModelAvailable) {
    logPublicRequestObservation({
      correlation,
      route: 'GET /api/cultures/:id',
      status: 503,
      durationMs: performance.now() - requestStartedAt,
      dataSource: 'kv-read-model-missing',
    });
    return NextResponse.json(
      { error: '문화 상세 read model이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.' },
      {
        status: 503,
        headers: { ...NO_STORE_CACHE_HEADERS, 'X-Culture-Data-Source': 'kv-read-model-missing' },
      }
    );
  }

  return NextResponse.json(
    { error: '해당 문화를 찾을 수 없습니다.' },
    { status: 404, headers: NO_STORE_CACHE_HEADERS }
  );
}
