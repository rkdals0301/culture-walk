import { createCacheKey, getCulturesCacheVersion, readKvCache, writeKvCache } from '@/cache/kv';
import { getDb } from '@/db/client';
import { cultures, cultureTourApiDetails } from '@/db/schema';
import { getWorkerEnv } from '@/server/cloudflare';
import { hasMissingSqliteTableError } from '@/server/sqliteError';
import { getTourApiContentId } from '@/services/cultureIdentity';
import { mapCultureRowToCulture } from '@/services/cultureService';
import { fetchTourApiFestivalDetails } from '@/services/cultureSyncSource';
import { TOUR_API_BASE_URL } from '@/services/cultureSyncTypes';
import {
  createTourApiDetailSummary,
  parseStoredTourApiDetails,
  serializeTourApiDetails,
} from '@/services/tourApiDetails';
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

    const row = await db.query.cultures.findFirst({
      where: and(eq(cultures.id, parsedId), eq(cultures.isActive, true)),
    });

    if (!row) {
      return NextResponse.json({ error: '해당 문화를 찾을 수 없습니다.' }, { status: 404 });
    }

    const contentId = getTourApiContentId(row.sourceKey);
    let storedDetails = row.sourceKey
      ? await db.query.cultureTourApiDetails.findFirst({
          where: eq(cultureTourApiDetails.sourceKey, row.sourceKey),
        })
      : null;
    let details = storedDetails ? parseStoredTourApiDetails(storedDetails) : undefined;
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

    if (contentId && !hasCurrentCompleteDetails) {
      const env = await getWorkerEnv();
      const serviceKey = env.TOUR_API_KEY ?? process.env.TOUR_API_KEY;

      if (serviceKey) {
        try {
          const fetchedDetails = await fetchTourApiFestivalDetails(
            {
              baseUrl: env.TOUR_API_BASE_URL ?? process.env.TOUR_API_BASE_URL ?? TOUR_API_BASE_URL,
              serviceKey,
            },
            contentId
          );
          const serialized = serializeTourApiDetails(fetchedDetails);
          const syncedAt = new Date().toISOString();

          await db
            .insert(cultureTourApiDetails)
            .values({
              sourceKey: row.sourceKey as string,
              sourceModifiedAt: row.registrationDate,
              ...serialized,
              syncedAt,
            })
            .onConflictDoUpdate({
              target: cultureTourApiDetails.sourceKey,
              set: {
                sourceModifiedAt: row.registrationDate,
                ...serialized,
                syncedAt,
              },
            });

          await db
            .update(cultures)
            .set({
              ...createTourApiDetailSummary(fetchedDetails),
              updatedAt: syncedAt,
            })
            .where(eq(cultures.id, row.id));

          storedDetails = {
            sourceKey: row.sourceKey as string,
            sourceModifiedAt: row.registrationDate,
            ...serialized,
            syncedAt,
          };
          details = fetchedDetails;
        } catch (error) {
          console.warn(`TourAPI 상세정보 갱신을 건너뜁니다. contentid=${contentId}`, error);
        }
      }
    }

    const culture = mapCultureRowToCulture(row, details);
    const responseCacheKey = createCacheKey('cultures:detail:v2', {
      version: cacheVersion,
      id: parsedId,
      sourceModifiedAt: row.registrationDate,
      detailsSyncedAt: storedDetails?.syncedAt,
    });
    await writeKvCache(responseCacheKey, culture, CACHE_TTL_SECONDS);

    return NextResponse.json(culture);
  } catch (error) {
    if (hasMissingSqliteTableError(error, 'cultures')) {
      return NextResponse.json({ error: '문화 데이터 저장소가 아직 준비되지 않았습니다.' }, { status: 503 });
    }

    console.error('문화 데이터를 가져오는데 실패했습니다.', error);
    return NextResponse.json({ error: '문화 데이터를 가져오는데 실패했습니다.' }, { status: 500 });
  }
}
