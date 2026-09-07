import { getDb } from '@/db/client';
import { hasD1DailyRowReadLimitError, hasMissingSqliteTableError } from '@/server/sqliteError';
import { getCultureListSnapshot } from '@/services/cultureList';
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
  try {
    const snapshot = await getCultureListSnapshot();
    if (!snapshot) {
      const db = await getDb();
      if (!db) {
        console.error('D1 데이터베이스 바인딩을 찾지 못해 문화 목록을 제공할 수 없습니다.');
        return NextResponse.json({ error: '문화 데이터 저장소가 아직 준비되지 않았습니다.' }, { status: 503 });
      }
    }

    return listResponse(
      snapshot?.items ?? [],
      snapshot?.source === 'kv-list-fallback' ? 'kv-list-fallback' : undefined
    );
  } catch (error) {
    if (hasMissingSqliteTableError(error, 'cultures')) {
      console.error('cultures 테이블이 없어 문화 목록을 제공할 수 없습니다.');
      return NextResponse.json({ error: '문화 데이터 저장소가 아직 준비되지 않았습니다.' }, { status: 503 });
    }

    if (hasD1DailyRowReadLimitError(error)) {
      return NextResponse.json(
        { error: '문화 목록을 잠시 불러올 수 없습니다. 잠시 후 다시 시도해주세요.' },
        { status: 503, headers: { 'Cache-Control': 'no-store', 'X-Culture-Data-Source': 'd1-unavailable' } }
      );
    }

    console.error('문화 목록 데이터를 가져오는데 실패했습니다.', error);
    return NextResponse.json({ error: '문화 목록 데이터를 가져오는데 실패했습니다.' }, { status: 500 });
  }
}
