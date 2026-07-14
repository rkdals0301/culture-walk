import { createCacheKey, getCulturesCacheVersion, readKvCache, writeKvCache } from '@/cache/kv';
import { getDb } from '@/db/client';
import { cultures } from '@/db/schema';
import { hasMissingSqliteTableError } from '@/server/sqliteError';
import { normalizeCultureCoordinates } from '@/services/cultureService';
import { CultureListItem } from '@/types/culture';
import { sortCulturesByRelevantDate } from '@/utils/cultureSort';
import { getKoreaDateStartIso } from '@/utils/dateUtils';

import { NextResponse } from 'next/server';

import { and, eq, gte, isNotNull, or, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const CACHE_TTL_SECONDS = 60 * 10;
const HTTP_CACHE_SECONDS = 60;
const HTTP_STALE_SECONDS = 60 * 30;
const KOREA_LAT_MIN = 33;
const KOREA_LAT_MAX = 39.8;
const KOREA_LNG_MIN = 124;
const KOREA_LNG_MAX = 132;

const toDateOrNow = (value?: string | null) => {
  if (!value) return new Date();

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date();
  return parsed;
};

const listResponse = (data: CultureListItem[]) =>
  NextResponse.json(data, {
    headers: {
      'Cache-Control': `public, max-age=${HTTP_CACHE_SECONDS}, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=${HTTP_STALE_SECONDS}`,
    },
  });

export async function GET() {
  try {
    const db = await getDb();
    if (!db) {
      console.error('D1 데이터베이스 바인딩을 찾지 못해 문화 목록을 제공할 수 없습니다.');
      return NextResponse.json({ error: '문화 데이터 저장소가 아직 준비되지 않았습니다.' }, { status: 503 });
    }

    const koreaToday = getKoreaDateStartIso();

    const cacheVersion = await getCulturesCacheVersion();
    const cacheKey = createCacheKey('cultures:list:v5', {
      version: cacheVersion,
      koreaDate: koreaToday.slice(0, 10),
    });

    const cached = await readKvCache<CultureListItem[]>(cacheKey);
    if (cached) {
      return listResponse(cached);
    }

    const rows = await db
      .select({
        id: cultures.id,
        classification: cultures.classification,
        endDate: cultures.endDate,
        guName: cultures.guName,
        isFree: cultures.isFree,
        lat: cultures.lat,
        lng: cultures.lng,
        mainImage: cultures.mainImage,
        place: cultures.place,
        startDate: cultures.startDate,
        title: cultures.title,
        useFee: cultures.useFee,
      })
      .from(cultures)
      .where(
        and(
          eq(cultures.isActive, true),
          isNotNull(cultures.lat),
          isNotNull(cultures.lng),
          isNotNull(cultures.startDate),
          isNotNull(cultures.endDate),
          or(
            and(
              sql`${cultures.lat} BETWEEN ${KOREA_LAT_MIN} AND ${KOREA_LAT_MAX}`,
              sql`${cultures.lng} BETWEEN ${KOREA_LNG_MIN} AND ${KOREA_LNG_MAX}`
            ),
            and(
              sql`${cultures.lng} BETWEEN ${KOREA_LAT_MIN} AND ${KOREA_LAT_MAX}`,
              sql`${cultures.lat} BETWEEN ${KOREA_LNG_MIN} AND ${KOREA_LNG_MAX}`
            )
          ),
          gte(cultures.endDate, koreaToday)
        )
      );

    const result: CultureListItem[] = rows.map(row => {
      const coordinates = normalizeCultureCoordinates(row.lat, row.lng);

      return {
        id: row.id,
        classification: row.classification ?? '',
        endDate: toDateOrNow(row.endDate ?? row.startDate),
        guName: row.guName ?? '',
        isFree: row.isFree ?? '',
        lat: coordinates.lat,
        lng: coordinates.lng,
        mainImage: row.mainImage ?? '/assets/images/logo.svg',
        place: row.place ?? '',
        startDate: toDateOrNow(row.startDate),
        title: row.title ?? '',
        useFee: row.useFee ?? '',
      };
    });
    const sortedResult = sortCulturesByRelevantDate(result, koreaToday);
    await writeKvCache(cacheKey, sortedResult, CACHE_TTL_SECONDS);

    return listResponse(sortedResult);
  } catch (error) {
    if (hasMissingSqliteTableError(error, 'cultures')) {
      console.error('cultures 테이블이 없어 문화 목록을 제공할 수 없습니다.');
      return NextResponse.json({ error: '문화 데이터 저장소가 아직 준비되지 않았습니다.' }, { status: 503 });
    }

    console.error('문화 목록 데이터를 가져오는데 실패했습니다.', error);
    return NextResponse.json({ error: '문화 목록 데이터를 가져오는데 실패했습니다.' }, { status: 500 });
  }
}
