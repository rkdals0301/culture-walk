import { getCulturePublicListSnapshot } from '@/services/cultureList';
import { CultureListItem } from '@/types/culture';

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CACHE_TTL_SECONDS = 60 * 10;
const HTTP_CACHE_SECONDS = 60;
const HTTP_STALE_SECONDS = 60 * 30;

const listResponse = (data: CultureListItem[], source?: string) =>
  NextResponse.json(data, {
    headers: {
      'Cache-Control': `public, max-age=${HTTP_CACHE_SECONDS}, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=${HTTP_STALE_SECONDS}`,
      ...(source ? { 'X-Culture-Data-Source': source } : {}),
    },
  });

export async function GET() {
  const snapshot = await getCulturePublicListSnapshot();
  if (!snapshot) {
    return NextResponse.json(
      { error: '문화 목록 read model이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.' },
      { status: 503, headers: { 'Cache-Control': 'no-store', 'X-Culture-Data-Source': 'kv-read-model-missing' } }
    );
  }

  return listResponse(snapshot.items, snapshot.source);
}
