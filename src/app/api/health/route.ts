import { cultures } from '@/db/schema';
import { getDb } from '@/db/client';
import { hasMissingSqliteTableError } from '@/server/sqliteError';

import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const KOREA_LAT_MIN = 33;
const KOREA_LAT_MAX = 39.8;
const KOREA_LNG_MIN = 124;
const KOREA_LNG_MAX = 132;

const toCount = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function GET() {
  try {
    const db = await getDb();
    if (!db) {
      return NextResponse.json(
        {
          ok: false,
          error: 'D1 데이터베이스 바인딩을 찾을 수 없습니다.',
        },
        { status: 503 }
      );
    }

    const now = new Date();
    const utcToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)).toISOString();

    const [row] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        activeTotal: sql<number>`SUM(CASE WHEN ${cultures.endDate} >= ${utcToday} THEN 1 ELSE 0 END)`,
        activeNormalCoordinates: sql<number>`SUM(
          CASE WHEN ${cultures.endDate} >= ${utcToday}
            AND ${cultures.lat} BETWEEN ${KOREA_LAT_MIN} AND ${KOREA_LAT_MAX}
            AND ${cultures.lng} BETWEEN ${KOREA_LNG_MIN} AND ${KOREA_LNG_MAX}
          THEN 1 ELSE 0 END
        )`,
        activeSwappedCoordinates: sql<number>`SUM(
          CASE WHEN ${cultures.endDate} >= ${utcToday}
            AND ${cultures.lng} BETWEEN ${KOREA_LAT_MIN} AND ${KOREA_LAT_MAX}
            AND ${cultures.lat} BETWEEN ${KOREA_LNG_MIN} AND ${KOREA_LNG_MAX}
          THEN 1 ELSE 0 END
        )`,
        latestUpdatedAt: sql<string | null>`MAX(${cultures.updatedAt})`,
        latestEndDate: sql<string | null>`MAX(${cultures.endDate})`,
      })
      .from(cultures);

    const total = toCount(row?.total);
    const activeTotal = toCount(row?.activeTotal);
    const activeNormalCoordinates = toCount(row?.activeNormalCoordinates);
    const activeSwappedCoordinates = toCount(row?.activeSwappedCoordinates);
    const activeVisible = activeNormalCoordinates + activeSwappedCoordinates;
    const activeInvalidCoordinates = Math.max(activeTotal - activeVisible, 0);
    const ok = total > 0 && activeVisible > 0 && activeInvalidCoordinates === 0;

    return NextResponse.json(
      {
        ok,
        checkedAt: now.toISOString(),
        total,
        activeTotal,
        activeVisible,
        activeNormalCoordinates,
        activeSwappedCoordinates,
        activeInvalidCoordinates,
        latestUpdatedAt: row?.latestUpdatedAt ?? null,
        latestEndDate: row?.latestEndDate ?? null,
      },
      {
        status: ok ? 200 : 503,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    if (hasMissingSqliteTableError(error, 'cultures')) {
      return NextResponse.json({ ok: false, error: 'cultures 테이블이 없습니다.' }, { status: 503 });
    }

    console.error('헬스체크 실패:', error);
    return NextResponse.json({ ok: false, error: '헬스체크 실패' }, { status: 500 });
  }
}
