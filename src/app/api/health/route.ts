import { readCultureReadModelSnapshot } from '@/services/cultureList';

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MAX_SYNC_AGE_HOURS = 36;

const getAgeHours = (value: string | null, now: Date) => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, (now.getTime() - timestamp) / (60 * 60 * 1000));
};

/**
 * Public health is deliberately read-model-only. A health probe must never be
 * capable of exhausting the D1 row-read budget it is supposed to observe.
 * Deep database diagnostics belong in scheduled sync logs / Cloudflare tools.
 */
export async function GET() {
  const now = new Date();
  const snapshot = await readCultureReadModelSnapshot();

  if (!snapshot?.items.length) {
    return NextResponse.json(
      {
        ok: false,
        status: 'unavailable',
        checkedAt: now.toISOString(),
        servingSource: 'kv-read-model',
        databaseStatus: 'not-probed',
        reason: 'read-model-missing',
        readModel: {
          available: false,
          itemCount: 0,
          cachedAt: null,
          ageHours: null,
        },
        latestSync: null,
      },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store', 'X-Culture-Data-Source': 'kv-read-model-missing' },
      }
    );
  }

  const ageHours = getAgeHours(snapshot.cachedAt, now);
  const fresh = ageHours !== null && ageHours <= MAX_SYNC_AGE_HOURS;
  const reason = snapshot.cachedAt === null ? 'read-model-age-unknown' : fresh ? null : 'read-model-stale';

  return NextResponse.json(
    {
      ok: true,
      status: fresh ? 'healthy' : 'degraded',
      checkedAt: now.toISOString(),
      servingSource: 'kv-read-model',
      databaseStatus: 'not-probed',
      reason,
      message: fresh
        ? 'KV read model이 최신 상태입니다.'
        : 'KV read model로 서비스를 제공 중이며 다음 snapshot 동기화를 기다리고 있습니다.',
      readModel: {
        available: true,
        itemCount: snapshot.items.length,
        cachedAt: snapshot.cachedAt,
        ageHours,
      },
      latestSync: snapshot.cachedAt
        ? {
            status: 'success',
            completedAt: snapshot.cachedAt,
            ageHours,
          }
        : null,
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store', 'X-Culture-Data-Source': 'kv-read-model' },
    }
  );
}
