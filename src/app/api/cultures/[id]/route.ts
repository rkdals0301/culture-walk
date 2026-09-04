import {
  createCacheKey,
  getCulturesCacheVersion,
  readCultureDetailCache,
  readCultureListItemCache,
  readKvCache,
  readLegacyCultureDetailCache,
  writeCultureDetailCache,
  writeKvCache,
} from '@/cache/kv';
import { getDb } from '@/db/client';
import { cultureTourApiDetails, cultures } from '@/db/schema';
import { getWorkerEnv } from '@/server/cloudflare';
import { hasD1DailyRowReadLimitError, hasMissingSqliteTableError } from '@/server/sqliteError';
import { mapCultureListItemToCulture, mapCultureRowToCulture } from '@/services/cultureService';
import { requestCultureDetailRefresh } from '@/services/cultureSyncDetails';
import { getD1Binding } from '@/services/cultureSyncLock';
import { parseStoredTourApiDetails } from '@/services/tourApiDetails';
import { Culture } from '@/types/culture';

import { NextResponse } from 'next/server';

import { and, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
const CACHE_TTL_SECONDS = 60 * 10;
const DETAIL_CACHE_TTL_SECONDS = 60 * 60 * 24;
const D1_UNAVAILABLE_MESSAGE = '문화 상세 정보를 잠시 불러올 수 없습니다. 잠시 후 다시 시도해주세요.';

const createD1UnavailableResponse = () =>
  NextResponse.json(
    { error: D1_UNAVAILABLE_MESSAGE },
    {
      status: 503,
      headers: {
        'Cache-Control': 'no-store',
        'X-Culture-Data-Source': 'd1-unavailable',
      },
    }
  );

const readCultureFallback = async (id: number, cacheVersion: string, detailCache?: Culture | null) => {
  if (detailCache?.id === id) {
    return {
      culture: detailCache,
      source: 'kv-detail-fallback',
    } as const;
  }

  const legacyDetail = await readLegacyCultureDetailCache(id);
  if (legacyDetail?.id === id) {
    await writeCultureDetailCache(id, cacheVersion, legacyDetail, DETAIL_CACHE_TTL_SECONDS);
    return {
      culture: legacyDetail,
      source: 'kv-legacy-detail-fallback',
    } as const;
  }

  const cachedCulture = await readCultureListItemCache(id);
  if (cachedCulture) {
    return {
      culture: mapCultureListItemToCulture(cachedCulture),
      source: 'kv-list-fallback',
    } as const;
  }

  return null;
};

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
    const [cacheVersion, detailCacheRecord] = await Promise.all([
      getCulturesCacheVersion(),
      readCultureDetailCache(parsedId),
    ]);
    const detailCache = detailCacheRecord?.culture;
    const hasDetailCache = detailCache?.id === parsedId;
    if (hasDetailCache) {
      return NextResponse.json(detailCache, {
        headers: { 'X-Culture-Data-Source': 'kv-detail-cache' },
      });
    }

    const db = await getDb();
    if (!db) {
      const fallback = await readCultureFallback(parsedId, cacheVersion, detailCache);
      if (fallback) {
        return NextResponse.json(fallback.culture, {
          headers: { 'X-Culture-Data-Source': fallback.source },
        });
      }

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
      const fallback = await readCultureFallback(parsedId, cacheVersion, detailCache);
      if (fallback) {
        console.warn(`D1 상세 행 조회를 건너뛰고 캐시를 사용합니다. id=${parsedId}`, queryError);
        return NextResponse.json(fallback.culture, {
          headers: { 'X-Culture-Data-Source': fallback.source },
        });
      }

      if (hasD1DailyRowReadLimitError(queryError)) {
        console.warn(`D1 일일 row read 한도로 상세 조회를 중단합니다. id=${parsedId}`, queryError);
        return createD1UnavailableResponse();
      }

      throw queryError;
    }

    if (!row) {
      return NextResponse.json({ error: '해당 문화를 찾을 수 없습니다.' }, { status: 404 });
    }

    let storedDetails = null;
    let detailQueryFailed = false;
    if (row.sourceKey) {
      try {
        storedDetails = await db.query.cultureTourApiDetails.findFirst({
          where: eq(cultureTourApiDetails.sourceKey, row.sourceKey),
        });
      } catch (detailError) {
        detailQueryFailed = true;
        console.warn(`상세 캐시 조회를 건너뜁니다. sourceKey=${row.sourceKey}`, detailError);
      }
    }
    if (detailQueryFailed) {
      const fallback = await readCultureFallback(parsedId, cacheVersion, detailCache);
      if (fallback) {
        return NextResponse.json(fallback.culture, {
          headers: { 'X-Culture-Data-Source': fallback.source },
        });
      }
    }
    const details = storedDetails ? parseStoredTourApiDetails(storedDetails) : undefined;
    const hasCurrentCompleteDetails = Boolean(
      storedDetails?.isComplete && storedDetails.sourceModifiedAt === row.registrationDate
    );
    const cacheKey = createCacheKey('cultures:detail:v2', {
      version: cacheVersion,
      id: parsedId,
      sourceModifiedAt: row.registrationDate,
      detailsSyncedAt: storedDetails?.syncedAt,
    });

    if (hasCurrentCompleteDetails) {
      const cached = await readKvCache<Culture>(cacheKey);
      if (cached) {
        await writeCultureDetailCache(parsedId, cacheVersion, cached, DETAIL_CACHE_TTL_SECONDS);
        return NextResponse.json(cached);
      }
    }

    if (!detailQueryFailed && !hasCurrentCompleteDetails && row.sourceKey) {
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
    if (hasCurrentCompleteDetails) {
      await writeCultureDetailCache(parsedId, cacheVersion, culture, DETAIL_CACHE_TTL_SECONDS);
    }

    return NextResponse.json(culture, {
      headers: detailQueryFailed ? { 'X-Culture-Data-Source': 'd1-base-row-fallback' } : undefined,
    });
  } catch (error) {
    if (hasMissingSqliteTableError(error, 'cultures')) {
      return NextResponse.json({ error: '문화 데이터 저장소가 아직 준비되지 않았습니다.' }, { status: 503 });
    }

    if (hasD1DailyRowReadLimitError(error)) {
      return createD1UnavailableResponse();
    }

    console.error('문화 데이터를 가져오는데 실패했습니다.', error);
    return NextResponse.json({ error: '문화 데이터를 가져오는데 실패했습니다.' }, { status: 500 });
  }
}
