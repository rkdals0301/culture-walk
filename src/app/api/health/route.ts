import { cultureSyncRuns, cultures, cultureTourApiDetails } from '@/db/schema';
import { getDb } from '@/db/client';
import { hasMissingSqliteTableError } from '@/server/sqliteError';
import { getKoreaDateStartIso } from '@/utils/dateUtils';

import { NextResponse } from 'next/server';
import { desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const KOREA_LAT_MIN = 33;
const KOREA_LAT_MAX = 39.8;
const KOREA_LNG_MIN = 124;
const KOREA_LNG_MAX = 132;
const MAX_SYNC_AGE_HOURS = 36;

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
    const koreaToday = getKoreaDateStartIso(now);
    const maximumPlausibleEndDate = `${now.getUTCFullYear() + 5}-12-31T23:59:59.999Z`;

    const [aggregateRows, latestSyncRun] = await Promise.all([
      db.select({
        total: sql<number>`COUNT(*)`,
        sourceActiveTotal: sql<number>`SUM(CASE WHEN ${cultures.isActive} = 1 THEN 1 ELSE 0 END)`,
        tourApiActiveTotal: sql<number>`SUM(
          CASE WHEN ${cultures.isActive} = 1 AND ${cultures.sourceKey} LIKE 'tourapi:%' THEN 1 ELSE 0 END
        )`,
        legacyTotal: sql<number>`SUM(
          CASE WHEN ${cultures.sourceKey} IS NULL OR ${cultures.sourceKey} NOT LIKE 'tourapi:%' THEN 1 ELSE 0 END
        )`,
        deactivatedTotal: sql<number>`SUM(CASE WHEN ${cultures.isActive} = 0 THEN 1 ELSE 0 END)`,
        activeTotal: sql<number>`SUM(
          CASE WHEN ${cultures.isActive} = 1 AND ${cultures.endDate} >= ${koreaToday} THEN 1 ELSE 0 END
        )`,
        activeNormalCoordinates: sql<number>`SUM(
          CASE WHEN ${cultures.isActive} = 1 AND ${cultures.endDate} >= ${koreaToday}
            AND ${cultures.lat} BETWEEN ${KOREA_LAT_MIN} AND ${KOREA_LAT_MAX}
            AND ${cultures.lng} BETWEEN ${KOREA_LNG_MIN} AND ${KOREA_LNG_MAX}
          THEN 1 ELSE 0 END
        )`,
        activeSwappedCoordinates: sql<number>`SUM(
          CASE WHEN ${cultures.isActive} = 1 AND ${cultures.endDate} >= ${koreaToday}
            AND ${cultures.lng} BETWEEN ${KOREA_LAT_MIN} AND ${KOREA_LAT_MAX}
            AND ${cultures.lat} BETWEEN ${KOREA_LNG_MIN} AND ${KOREA_LNG_MAX}
          THEN 1 ELSE 0 END
        )`,
        implausibleActiveDates: sql<number>`SUM(
          CASE WHEN ${cultures.isActive} = 1
            AND (${cultures.endDate} > ${maximumPlausibleEndDate} OR ${cultures.endDate} < ${cultures.startDate})
          THEN 1 ELSE 0 END
        )`,
        latestUpdatedAt: sql<string | null>`MAX(
          CASE WHEN ${cultures.isActive} = 1 THEN ${cultures.updatedAt} ELSE NULL END
        )`,
        latestEndDate: sql<string | null>`MAX(
          CASE WHEN ${cultures.isActive} = 1 THEN ${cultures.endDate} ELSE NULL END
        )`,
        detailCachedTotal: sql<number>`(
          SELECT COUNT(*) FROM ${cultureTourApiDetails}
        )`,
        detailCompleteTotal: sql<number>`(
          SELECT COUNT(*) FROM ${cultureTourApiDetails} WHERE ${cultureTourApiDetails.isComplete} = 1
        )`,
        detailCurrentTotal: sql<number>`(
          SELECT COUNT(*)
          FROM culture_tour_api_details details
          INNER JOIN cultures detail_culture ON detail_culture.source_key = details.source_key
          WHERE details.is_complete = 1
            AND detail_culture.is_active = 1
            AND details.source_modified_at IS detail_culture.registration_date
        )`,
      })
      .from(cultures),
      db.query.cultureSyncRuns.findFirst({ orderBy: [desc(cultureSyncRuns.startedAt)] }),
    ]);

    const row = aggregateRows[0];
    const total = toCount(row?.total);
    const sourceActiveTotal = toCount(row?.sourceActiveTotal);
    const tourApiActiveTotal = toCount(row?.tourApiActiveTotal);
    const legacyTotal = toCount(row?.legacyTotal);
    const deactivatedTotal = toCount(row?.deactivatedTotal);
    const activeTotal = toCount(row?.activeTotal);
    const activeNormalCoordinates = toCount(row?.activeNormalCoordinates);
    const activeSwappedCoordinates = toCount(row?.activeSwappedCoordinates);
    const activeVisible = activeNormalCoordinates + activeSwappedCoordinates;
    const activeInvalidCoordinates = Math.max(activeTotal - activeVisible, 0);
    const implausibleActiveDates = toCount(row?.implausibleActiveDates);
    const detailCachedTotal = toCount(row?.detailCachedTotal);
    const detailCompleteTotal = toCount(row?.detailCompleteTotal);
    const detailCurrentTotal = toCount(row?.detailCurrentTotal);
    const latestSyncCompletedAt = latestSyncRun?.completedAt ?? null;
    const latestSyncAgeHours = latestSyncCompletedAt
      ? (now.getTime() - new Date(`${latestSyncCompletedAt.replace(' ', 'T')}Z`).getTime()) / (60 * 60 * 1000)
      : null;
    const hasFreshSuccessfulSync =
      latestSyncRun?.status === 'success' &&
      latestSyncAgeHours !== null &&
      Number.isFinite(latestSyncAgeHours) &&
      latestSyncAgeHours <= MAX_SYNC_AGE_HOURS;
    const ok =
      total > 0 &&
      sourceActiveTotal > 0 &&
      tourApiActiveTotal === sourceActiveTotal &&
      legacyTotal === 0 &&
      activeVisible > 0 &&
      activeInvalidCoordinates === 0 &&
      implausibleActiveDates === 0 &&
      hasFreshSuccessfulSync;

    return NextResponse.json(
      {
        ok,
        checkedAt: now.toISOString(),
        total,
        sourceActiveTotal,
        tourApiActiveTotal,
        legacyTotal,
        deactivatedTotal,
        activeTotal,
        activeVisible,
        activeNormalCoordinates,
        activeSwappedCoordinates,
        activeInvalidCoordinates,
        implausibleActiveDates,
        detailCachedTotal,
        detailCompleteTotal,
        detailCurrentTotal,
        latestUpdatedAt: row?.latestUpdatedAt ?? null,
        latestEndDate: row?.latestEndDate ?? null,
        latestSync: latestSyncRun
          ? {
              id: latestSyncRun.id,
              trigger: latestSyncRun.trigger,
              status: latestSyncRun.status,
              startedAt: latestSyncRun.startedAt,
              completedAt: latestSyncRun.completedAt,
              ageHours: latestSyncAgeHours,
              fetched: latestSyncRun.fetchedCount,
              inserted: latestSyncRun.insertedCount,
              updated: latestSyncRun.updatedCount,
              reactivated: latestSyncRun.reactivatedCount,
              deactivated: latestSyncRun.deactivatedCount,
              skipped: latestSyncRun.skippedCount,
              error: latestSyncRun.errorMessage,
            }
          : null,
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
