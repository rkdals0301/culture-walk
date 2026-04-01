import { bumpCulturesCacheVersion } from '@/cache/kv';
import { getDb } from '@/db/client';
import { NewCultureRow, cultures as culturesTable } from '@/db/schema';
import { getWorkerEnv } from '@/server/cloudflare';
import { mapRawCultureToCulture } from '@/services/cultureService';
import { RawCulture } from '@/types/culture';
import axiosInstance from '@/utils/axiosInstance';

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const INITIAL_START_INDEX = 1;
const PAGE_SIZE = 1000;
// D1/SQLite variable limits can fail on large multi-row inserts.
const BATCH_SIZE = 30;
const RETRY_LIMIT = 3;
const KOREA_LAT_MIN = 33;
const KOREA_LAT_MAX = 39.8;
const KOREA_LNG_MIN = 124;
const KOREA_LNG_MAX = 132;
const MIN_VALID_COORDINATE_COUNT = 5;
const MIN_VALID_COORDINATE_RATIO = 0.03;
type DbClient = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type InsertableDb = Pick<DbClient, 'insert'>;

const fetchCultures = async (baseUrl: string) => {
  const allCultures: RawCulture[] = [];
  let startIndex = INITIAL_START_INDEX;
  let endIndex = PAGE_SIZE;
  let totalDataCount = 0;

  const firstResponse = await axiosInstance.get(`${baseUrl}/${startIndex}/${endIndex}`);
  totalDataCount = firstResponse.data?.culturalEventInfo?.list_total_count || 0;
  const firstCultures = firstResponse.data?.culturalEventInfo?.row || [];
  allCultures.push(...firstCultures);
  startIndex += PAGE_SIZE;
  endIndex += PAGE_SIZE;

  const requests = [];
  while (startIndex <= totalDataCount) {
    requests.push(axiosInstance.get(`${baseUrl}/${startIndex}/${endIndex}`));
    startIndex += PAGE_SIZE;
    endIndex += PAGE_SIZE;
  }

  const responses = await Promise.allSettled(requests);
  let failedRequestCount = 0;

  for (const result of responses) {
    if (result.status === 'fulfilled') {
      const rows = result.value?.data?.culturalEventInfo?.row || [];
      allCultures.push(...rows);
    } else {
      failedRequestCount += 1;
      console.error('문화 API 요청 실패:', result.reason);
    }
  }

  if (failedRequestCount > 0) {
    throw new Error(`문화 API 요청 ${failedRequestCount}건이 실패했습니다.`);
  }

  return allCultures;
};

const retryInsertBatch = async (
  db: InsertableDb,
  batch: NewCultureRow[],
  retries: number
): Promise<void> => {
  try {
    await db.insert(culturesTable).values(batch);
  } catch (error) {
    if (retries > 0) {
      console.warn(`배치 insert 재시도. 남은 횟수: ${retries}`, error);
      await retryInsertBatch(db, batch, retries - 1);
      return;
    }
    throw error;
  }
};

const isBetween = (value: number, min: number, max: number) => value >= min && value <= max;

const looksLikeKoreaLat = (value: number) => isBetween(value, KOREA_LAT_MIN, KOREA_LAT_MAX);
const looksLikeKoreaLng = (value: number) => isBetween(value, KOREA_LNG_MIN, KOREA_LNG_MAX);

const normalizeCoordinates = (
  lat: number | null,
  lng: number | null
): { lat: number | null; lng: number | null; status: 'kept' | 'swapped' | 'invalid' } => {
  const hasLat = typeof lat === 'number' && Number.isFinite(lat);
  const hasLng = typeof lng === 'number' && Number.isFinite(lng);

  if (!hasLat || !hasLng) {
    return { lat: null, lng: null, status: 'invalid' };
  }

  if (looksLikeKoreaLng(lat) && looksLikeKoreaLat(lng)) {
    return { lat: lng, lng: lat, status: 'swapped' };
  }

  const isValidGlobalLat = isBetween(lat, -90, 90);
  const isValidGlobalLng = isBetween(lng, -180, 180);

  if (!isValidGlobalLat || !isValidGlobalLng) {
    return { lat: null, lng: null, status: 'invalid' };
  }

  return { lat, lng, status: 'kept' };
};

const normalizeAndValidateRows = (rows: NewCultureRow[]) => {
  let swappedCount = 0;
  let validCoordinateCount = 0;
  let invalidCoordinateCount = 0;

  const normalizedRows = rows.map(row => {
    const normalized = normalizeCoordinates(row.lat ?? null, row.lng ?? null);

    if (normalized.status === 'swapped') {
      swappedCount += 1;
      validCoordinateCount += 1;
    } else if (normalized.status === 'kept') {
      validCoordinateCount += 1;
    } else {
      invalidCoordinateCount += 1;
    }

    return { ...row, lat: normalized.lat, lng: normalized.lng };
  });

  const validRatio = validCoordinateCount / normalizedRows.length;

  if (validCoordinateCount < MIN_VALID_COORDINATE_COUNT || validRatio < MIN_VALID_COORDINATE_RATIO) {
    throw new Error(
      `좌표 데이터 품질이 기준 미달입니다. valid=${validCoordinateCount}, invalid=${invalidCoordinateCount}, swapped=${swappedCount}, total=${normalizedRows.length}`
    );
  }

  console.info(
    `좌표 정규화 완료: valid=${validCoordinateCount}, invalid=${invalidCoordinateCount}, swapped=${swappedCount}, total=${normalizedRows.length}`
  );

  return normalizedRows;
};

const replaceCultures = async (db: DbClient, rows: RawCulture[]) => {
  const mappedRows = rows.map(mapRawCultureToCulture);

  if (mappedRows.length === 0) {
    throw new Error('외부 API에서 유효한 문화 데이터를 가져오지 못했습니다.');
  }

  const normalizedRows = normalizeAndValidateRows(mappedRows);
  const previousRows = await db.select().from(culturesTable);
  await db.delete(culturesTable);

  try {
    for (let i = 0; i < normalizedRows.length; i += BATCH_SIZE) {
      const batch = normalizedRows.slice(i, i + BATCH_SIZE);
      await retryInsertBatch(db, batch, RETRY_LIMIT);
    }
  } catch (error) {
    console.error('문화 데이터 교체 실패. 기존 데이터 복원을 시도합니다.', error);

    try {
      if (previousRows.length > 0) {
        await db.delete(culturesTable);

        for (let i = 0; i < previousRows.length; i += BATCH_SIZE) {
          const batch = previousRows.slice(i, i + BATCH_SIZE);
          await retryInsertBatch(db, batch, RETRY_LIMIT);
        }
      }
    } catch (restoreError) {
      console.error('기존 문화 데이터 복원에 실패했습니다.', restoreError);
    }

    throw error;
  }
};

const isProductionEnvironment = () => process.env.NODE_ENV === 'production';

export async function POST(request: NextRequest) {
  try {
    const env = await getWorkerEnv();
    const syncToken = env.SYNC_TOKEN;
    const requestToken = request.headers.get('x-sync-token');

    if (isProductionEnvironment() && !syncToken) {
      return NextResponse.json({ message: 'SYNC_TOKEN is required in production' }, { status: 503 });
    }

    if (syncToken && requestToken !== syncToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const baseUrl = env.SEOUL_API_CULTURAL_URL ?? process.env.SEOUL_API_CULTURAL_URL;
    if (!baseUrl) {
      return NextResponse.json({ error: 'SEOUL_API_CULTURAL_URL이 설정되지 않았습니다.' }, { status: 500 });
    }

    const db = await getDb();
    if (!db) {
      return NextResponse.json({ error: 'D1 데이터베이스 바인딩을 찾을 수 없습니다.' }, { status: 503 });
    }

    const externalData = await fetchCultures(baseUrl);
    if (externalData.length === 0) {
      return NextResponse.json({ error: '외부 API에서 가져온 데이터가 없습니다.' }, { status: 502 });
    }

    await replaceCultures(db, externalData);
    await bumpCulturesCacheVersion();

    return NextResponse.json(
      { message: '데이터베이스 업데이트 성공', totalFetched: externalData.length },
      { status: 200 }
    );
  } catch (error) {
    console.error('데이터베이스 업데이트 실패:', error);
    return NextResponse.json({ error: '데이터베이스 업데이트 실패' }, { status: 500 });
  }
}
