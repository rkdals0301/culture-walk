import { getCulturePublicListSnapshot } from '@/services/cultureList';
import {
  CULTURE_EDGE_CACHE_TAGS,
  createPublicEdgeCacheHeaders,
  NO_STORE_CACHE_HEADERS,
} from '@/server/httpCache';
import { CultureListItem } from '@/types/culture';

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const HTTP_CACHE_SECONDS = 60;
const EDGE_CACHE_SECONDS = 60 * 10;
const HTTP_STALE_SECONDS = 60 * 30;
const HTTP_STALE_IF_ERROR_SECONDS = 60 * 60 * 24;

const listResponse = (data: CultureListItem[], source?: string) =>
  NextResponse.json(data, {
    headers: createPublicEdgeCacheHeaders({
      browserMaxAgeSeconds: HTTP_CACHE_SECONDS,
      edgeMaxAgeSeconds: EDGE_CACHE_SECONDS,
      staleWhileRevalidateSeconds: HTTP_STALE_SECONDS,
      staleIfErrorSeconds: HTTP_STALE_IF_ERROR_SECONDS,
      source,
      tags: [CULTURE_EDGE_CACHE_TAGS.all, CULTURE_EDGE_CACHE_TAGS.list],
    }),
  });

export async function GET() {
  const snapshot = await getCulturePublicListSnapshot();
  if (!snapshot) {
    return NextResponse.json(
      { error: '문화 목록 read model이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.' },
      {
        status: 503,
        headers: { ...NO_STORE_CACHE_HEADERS, 'X-Culture-Data-Source': 'kv-read-model-missing' },
      }
    );
  }

  return listResponse(snapshot.items, snapshot.source);
}
