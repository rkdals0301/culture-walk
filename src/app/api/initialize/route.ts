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
const BATCH_SIZE = 4;
const RETRY_LIMIT = 3;
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

const replaceCultures = async (db: DbClient, rows: RawCulture[]) => {
  const mappedRows = rows.map(mapRawCultureToCulture);

  if (mappedRows.length === 0) {
    throw new Error('외부 API에서 유효한 문화 데이터를 가져오지 못했습니다.');
  }

  const previousRows = await db.select().from(culturesTable);
  await db.delete(culturesTable);

  try {
    for (let i = 0; i < mappedRows.length; i += BATCH_SIZE) {
      const batch = mappedRows.slice(i, i + BATCH_SIZE);
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
