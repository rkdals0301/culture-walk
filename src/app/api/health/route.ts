import {
  getSerializedUtf8ByteLength,
  readCultureReadModelMetadataCache,
  writeCultureReadModelMetadataCache,
} from '@/cache/kv';
import { getRuntimeDeps } from '@/server/cloudflare';
import { CULTURE_EDGE_CACHE_TAGS } from '@/server/httpCache';
import { createServerTimingHeader } from '@/server/serverTiming';
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
  const requestStartedAt = performance.now();
  const now = new Date();
  const { cache } = await getRuntimeDeps();
  const metadataReadStartedAt = performance.now();
  const metadata = await readCultureReadModelMetadataCache(cache);
  const metadataReadDurationMs = performance.now() - metadataReadStartedAt;

  let itemCount = metadata?.itemCount ?? 0;
  let cachedAt: string | null = metadata?.cachedAt ?? null;
  let serializedBytes: number | null = metadata?.serializedBytes ?? null;
  let healthSource = 'kv-read-model-metadata';

  if (!metadata || metadata.serializedBytes === null) {
    const snapshot = await readCultureReadModelSnapshot(cache);
    if (!metadata) {
      itemCount = snapshot?.items.length ?? 0;
      cachedAt = snapshot?.cachedAt ?? null;
      healthSource = snapshot ? 'kv-read-model-fallback' : 'kv-read-model-missing';
    } else if (snapshot) {
      healthSource = 'kv-read-model-metadata-repaired';
    }

    if (snapshot?.cachedAt && snapshot.items.length > 0) {
      serializedBytes = getSerializedUtf8ByteLength(snapshot);
      await writeCultureReadModelMetadataCache(
        {
          cachedAt: snapshot.cachedAt,
          itemCount: snapshot.items.length,
          serializedBytes,
        },
        cache
      );
    }
  }

  if (itemCount === 0) {
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
          serializedBytes: null,
        },
        latestSync: null,
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
          'Cloudflare-CDN-Cache-Control': 'no-store',
          'X-Culture-Data-Source': healthSource,
          'Server-Timing': createServerTimingHeader([
            { name: 'health-meta', durationMs: metadataReadDurationMs },
            { name: 'total', durationMs: performance.now() - requestStartedAt },
          ]),
        },
      }
    );
  }

  const ageHours = getAgeHours(cachedAt, now);
  const fresh = ageHours !== null && ageHours <= MAX_SYNC_AGE_HOURS;
  const reason = cachedAt === null ? 'read-model-age-unknown' : fresh ? null : 'read-model-stale';

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
        itemCount,
        cachedAt,
        ageHours,
        serializedBytes,
      },
      latestSync: cachedAt
        ? {
            status: 'success',
            completedAt: cachedAt,
            ageHours,
          }
        : null,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'Cloudflare-CDN-Cache-Control':
          'public, max-age=30, stale-while-revalidate=30, stale-if-error=60',
        'Cache-Tag': CULTURE_EDGE_CACHE_TAGS.all + ',' + CULTURE_EDGE_CACHE_TAGS.list,
        'X-Culture-Data-Source': healthSource,
        'Server-Timing': createServerTimingHeader([
          { name: 'health-meta', durationMs: metadataReadDurationMs, description: healthSource },
          { name: 'total', durationMs: performance.now() - requestStartedAt },
        ]),
      },
    }
  );
}
