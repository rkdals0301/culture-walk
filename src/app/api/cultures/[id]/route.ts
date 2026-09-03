import {
  createCacheKey,
  getCulturesCacheVersion,
  readCultureListItemCache,
  readKvCache,
  writeKvCache,
} from '@/cache/kv';
import { getDb } from '@/db/client';
import { cultures, cultureTourApiDetails } from '@/db/schema';
import { getWorkerEnv } from '@/server/cloudflare';
import { hasMissingSqliteTableError } from '@/server/sqliteError';
import { getD1Binding } from '@/services/cultureSyncLock';
import { requestCultureDetailRefresh } from '@/services/cultureSyncDetails';
import { mapCultureListItemToCulture, mapCultureRowToCulture } from '@/services/cultureService';
import { parseStoredTourApiDetails } from '@/services/tourApiDetails';
import { Culture } from '@/types/culture';

import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
const CACHE_TTL_SECONDS = 60 * 10;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'ID 파라미터가 필요합니다.' }, { status: 400 });
  }

  if (!/^[1-9]\d*$/.test(id)) {
    return NextResponse.json({ error: '유효하지 않은 ID 파라미터입니다.' }, { status: 400 });
  }
  const parsedId = Number(id);

  try {
    const db = await getDb();
    if (!db) {
      return NextResponse.json({ error: '문화 데이터 저장소가 아직 준비되지 않았습니다.' }, { status: 503 });
    }

    let row;
    try {
      [row] = await db
        .select({
          id: cultures.id,
          sourceKey: cultures.sourceKey,
          classification: cultures.classification,
          date: cultures.date,
          endDate: cultures.endDate,
          etcDescription: cultures.etcDescription,
          guName: cultures.guName,
          homepageDetailAddress: cultures.homepageDetailAddress,
          isFree: cultures.isFree,
          lat: cultures.lat,
          lng: cultures.lng,
          mainImage: cultures.mainImage,
          homepageAddress: cultures.homepageAddress,
          organizationName: cultures.organizationName,
          place: cultures.place,
          performerInformation: cultures.performerInformation,
          programIntroduction: cultures.programIntroduction,
          registrationDate: cultures.registrationDate,
          startDate: cultures.startDate,
          themeClassification: cultures.themeClassification,
          register: cultures.register,
          title: cultures.title,
          useFee: cultures.useFee,
          useTarget: cultures.useTarget,
          createdAt: cultures.createdAt,
          updatedAt: cultures.updatedAt,
        })
        .from(cultures)
        .where(and(eq(cultures.id, parsedId), eq(cultures.isActive, true)))
        .limit(1);
    } catch (queryError) {
      const cachedCulture = await readCultureListItemCache(parsedId);
      if (!cachedCulture) {
        throw queryError;
      }

      console.warn(`D1 상세 행 조회를 건너뛰고 목록 캐시를 사용합니다. id=${parsedId}`, queryError);
      return NextResponse.json(mapCultureListItemToCulture(cachedCulture), {
        headers: { 'X-Culture-Data-Source': 'kv-list-fallback' },
      });
    }

    if (!row) {
      return NextResponse.json({ error: '해당 문화를 찾을 수 없습니다.' }, { status: 404 });
    }

    let storedDetails = null;
    if (row.sourceKey) {
      try {
        storedDetails = await db.query.cultureTourApiDetails.findFirst({
          where: eq(cultureTourApiDetails.sourceKey, row.sourceKey),
        });
      } catch (detailError) {
        console.warn(`상세 캐시 조회를 건너뜁니다. sourceKey=${row.sourceKey}`, detailError);
      }
    }
    const details = storedDetails ? parseStoredTourApiDetails(storedDetails) : undefined;
    const hasCurrentCompleteDetails = Boolean(
      storedDetails?.isComplete && storedDetails.sourceModifiedAt === row.registrationDate
    );
    const cacheVersion = await getCulturesCacheVersion();
    const cacheKey = createCacheKey('cultures:detail:v2', {
      version: cacheVersion,
      id: parsedId,
      sourceModifiedAt: row.registrationDate,
      detailsSyncedAt: storedDetails?.syncedAt,
    });

    if (hasCurrentCompleteDetails) {
      const cached = await readKvCache<Culture>(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    if (!hasCurrentCompleteDetails && row.sourceKey) {
      const env = await getWorkerEnv();
      const d1 = getD1Binding(env);
      if (d1) {
        try {
          await requestCultureDetailRefresh(d1, row.sourceKey);
        } catch (refreshError) {
          console.warn(`상세정보 보강 요청을 건너뜁니다. sourceKey=${row.sourceKey}`, refreshError);
        }
      }
    }

    const culture = mapCultureRowToCulture(row, details);
    await writeKvCache(cacheKey, culture, CACHE_TTL_SECONDS);

    return NextResponse.json(culture);
  } catch (error) {
    if (hasMissingSqliteTableError(error, 'cultures')) {
      return NextResponse.json({ error: '문화 데이터 저장소가 아직 준비되지 않았습니다.' }, { status: 503 });
    }

    console.error('문화 데이터를 가져오는데 실패했습니다.', error);
    return NextResponse.json({ error: '문화 데이터를 가져오는데 실패했습니다.' }, { status: 500 });
  }
}
