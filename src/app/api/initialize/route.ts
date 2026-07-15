import { getWorkerEnv } from '@/server/cloudflare';
import { acquireInitializeLock, getD1Binding, releaseInitializeLock } from '@/services/cultureSyncLock';
import { syncCultures } from '@/services/cultureSyncService';
import { TOUR_API_BASE_URL } from '@/services/cultureSyncTypes';

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const isProductionEnvironment = () => process.env.NODE_ENV === 'production';

export async function POST(request: NextRequest) {
  let env: Awaited<ReturnType<typeof getWorkerEnv>> | null = null;
  let lockOwner: string | null = null;

  try {
    env = await getWorkerEnv();
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

    lockOwner = await acquireInitializeLock(env);
    if (!lockOwner) {
      return NextResponse.json({ message: '이미 동기화 작업이 진행 중입니다.' }, { status: 409 });
    }

    const trigger = request.headers.get('x-sync-trigger')?.trim() || 'manual';
    const result = await syncCultures(
      { baseUrl: env.TOUR_API_BASE_URL ?? process.env.TOUR_API_BASE_URL ?? TOUR_API_BASE_URL, serviceKey },
      d1,
      { trigger }
    );

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
    console.error('데이터베이스 업데이트 실패:', error);
    return NextResponse.json({ error: '데이터베이스 업데이트 실패' }, { status: 500 });
  } finally {
    if (env && lockOwner) {
      try {
        await releaseInitializeLock(env, lockOwner);
      } catch (error) {
        console.error('동기화 락 해제 실패:', error);
      }
    }
  }
}
