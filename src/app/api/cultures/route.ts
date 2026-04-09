import { createCacheKey, getCulturesCacheVersion, readKvCache, writeKvCache } from '@/cache/kv';
import { cultures } from '@/db/schema';
import { getDb } from '@/db/client';
import { hasMissingSqliteTableError } from '@/server/sqliteError';
import { mapCultureRowToCulture } from '@/services/cultureService';
import { Culture } from '@/types/culture';

import { NextResponse } from 'next/server';
import { and, asc, gte, isNotNull, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const CACHE_TTL_SECONDS = 60 * 10;
const KOREA_LAT_MIN = 33;
const KOREA_LAT_MAX = 39.8;
const KOREA_LNG_MIN = 124;
const KOREA_LNG_MAX = 132;

export async function GET() {
  try {
    const db = await getDb();
    if (!db) {
      console.error('D1 데이터베이스 바인딩을 찾지 못해 문화 목록을 제공할 수 없습니다.');
      return NextResponse.json({ error: '문화 데이터 저장소가 아직 준비되지 않았습니다.' }, { status: 503 });
    }

    const now = new Date();
    const utcToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)).toISOString();

    const cacheVersion = await getCulturesCacheVersion();
    const cacheKey = createCacheKey('cultures:list:v1', {
      version: cacheVersion,
      utcDate: utcToday.slice(0, 10),
    });

    const cached = await readKvCache<Culture[]>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const rows = await db
      .select()
      .from(cultures)
      .where(
        and(
          isNotNull(cultures.lat),
          isNotNull(cultures.lng),
          isNotNull(cultures.startDate),
          isNotNull(cultures.endDate),
          sql`${cultures.lat} BETWEEN ${KOREA_LAT_MIN} AND ${KOREA_LAT_MAX}`,
          sql`${cultures.lng} BETWEEN ${KOREA_LNG_MIN} AND ${KOREA_LNG_MAX}`,
          gte(cultures.endDate, utcToday)
        )
      )
      .orderBy(asc(cultures.startDate));

    const result = rows.map(mapCultureRowToCulture);
    await writeKvCache(cacheKey, result, CACHE_TTL_SECONDS);

    return NextResponse.json(result);
  } catch (error) {
    if (hasMissingSqliteTableError(error, 'cultures')) {
      console.error('cultures 테이블이 없어 문화 목록을 제공할 수 없습니다.');
      return NextResponse.json({ error: '문화 데이터 저장소가 아직 준비되지 않았습니다.' }, { status: 503 });
    }

    console.error('문화 목록 데이터를 가져오는데 실패했습니다.', error);
    return NextResponse.json({ error: '문화 목록 데이터를 가져오는데 실패했습니다.' }, { status: 500 });
  }
}
