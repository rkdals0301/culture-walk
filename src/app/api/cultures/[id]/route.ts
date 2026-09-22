import { getCulturePublicRead } from '@/services/cultureReadModel';
import { getRuntimeDeps } from '@/server/cloudflare';
import {
  CULTURE_EDGE_CACHE_TAGS,
  createPublicEdgeCacheHeaders,
  getCultureDetailEdgeCacheTag,
  NO_STORE_CACHE_HEADERS,
} from '@/server/httpCache';
import { CULTURE_CACHE_POLICY } from '@/server/cultureCachePolicy';

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const responseHeaders = (source: string, id: string) =>
  createPublicEdgeCacheHeaders({
    ...CULTURE_CACHE_POLICY.detail,
    source,
    tags: [CULTURE_EDGE_CACHE_TAGS.all, CULTURE_EDGE_CACHE_TAGS.detail, getCultureDetailEdgeCacheTag(id)],
  });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const result = await getCulturePublicRead(Number(id), await getRuntimeDeps());
  if (result.culture) {
    return NextResponse.json(result.culture, {
      headers: responseHeaders(result.source ?? 'kv-read-model', id),
    });
  }

  if (!result.readModelAvailable) {
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
