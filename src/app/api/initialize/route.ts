import type { CultureCacheBinding } from '@/cache/kv';
import { getWorkerEnv } from '@/server/cloudflare';
import { hasD1DailyRowWriteLimitError } from '@/server/sqliteError';
import {
  getD1Binding,
  runWithInitializeLock,
} from '@/services/cultureSyncLock';
import { syncCultures } from '@/services/cultureSyncService';
import { TOUR_API_BASE_URL } from '@/services/cultureSyncTypes';

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    const serviceKey = env.TOUR_API_KEY ?? process.env.TOUR_API_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: 'TOUR_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
    }

    const d1 = getD1Binding(env);
    if (!d1) {
      return NextResponse.json({ error: 'D1 데이터베이스 바인딩을 찾을 수 없습니다.' }, { status: 503 });
    }

    const trigger = request.headers.get('x-sync-trigger')?.trim() || 'manual';
    const lockedRun = await runWithInitializeLock(env, async heartbeat => {
      return syncCultures(
        { baseUrl: env.TOUR_API_BASE_URL ?? process.env.TOUR_API_BASE_URL ?? TOUR_API_BASE_URL, serviceKey },
        d1,
        {
          trigger,
          beforeEach: () => heartbeat.renew(),
          beforeApply: heartbeat.ensureHeld,
          cache: env.CULTURE_CACHE as CultureCacheBinding | undefined,
        }
      );
    });

    if (!lockedRun.acquired) {
      return NextResponse.json({ message: '이미 동기화 작업이 진행 중입니다.' }, { status: 409 });
    }
    const result = lockedRun.value;

    return NextResponse.json(
      {
        message: '데이터베이스 업데이트 성공',
        runId: result.runId,
        totalFetched: result.fetched,
        inserted: result.inserted,
        updated: result.updated,
        reactivated: result.reactivated,
        deactivated: result.deactivated,
        skipped: result.skipped,
        invalidCoordinates: result.invalidCoordinates,
        invalidDates: result.invalidDates,
        missingRequiredFields: result.missingRequiredFields,
      },
      { status: 200 }
    );
  } catch (error) {
    if (hasD1DailyRowWriteLimitError(error)) {
      return NextResponse.json(
        { error: 'Cloudflare D1 일일 쓰기 한도에 도달해 동기화를 실행할 수 없습니다.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    console.error('데이터베이스 업데이트 실패:', error);
    return NextResponse.json({ error: '데이터베이스 업데이트 실패' }, { status: 500 });
  }
}
