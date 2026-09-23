import {
  getSerializedUtf8ByteLength,
  readCultureReadModelMetadataCache,
  writeCultureReadModelMetadataCache,
} from '@/cache/kv';
import { assessCultureReadModelBudget } from '@/server/readModelBudget';
import type { RuntimeDeps } from '@/server/runtimeTypes';
import { readCultureReadModelSnapshot } from '@/services/cultureList';

export const MAX_SYNC_AGE_HOURS = 36;

const getAgeHours = (value: string | null, now: Date) => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, (now.getTime() - timestamp) / (60 * 60 * 1000));
};

export const getPublicHealthReport = async (deps: RuntimeDeps, now: Date = new Date()) => {
  const metadataReadStartedAt = performance.now();
  const metadata = await readCultureReadModelMetadataCache(deps.cache);
  const metadataReadDurationMs = performance.now() - metadataReadStartedAt;

  let itemCount = metadata?.itemCount ?? 0;
  let cachedAt: string | null = metadata?.cachedAt ?? null;
  let serializedBytes: number | null = metadata?.serializedBytes ?? null;
  let dataSource = 'kv-read-model-metadata';

  if (!metadata || metadata.serializedBytes === null) {
    const snapshot = await readCultureReadModelSnapshot(deps.cache);
    if (!metadata) {
      itemCount = snapshot?.items.length ?? 0;
      cachedAt = snapshot?.cachedAt ?? null;
      dataSource = snapshot ? 'kv-read-model-fallback' : 'kv-read-model-missing';
    } else if (snapshot) {
      dataSource = 'kv-read-model-metadata-repaired';
    }

    if (snapshot?.cachedAt && snapshot.items.length > 0) {
      serializedBytes = getSerializedUtf8ByteLength(snapshot);
      await writeCultureReadModelMetadataCache(
        {
          cachedAt: snapshot.cachedAt,
          itemCount: snapshot.items.length,
          serializedBytes,
        },
        deps.cache
      );
    }
  }

  const budget = assessCultureReadModelBudget(serializedBytes, itemCount);
  const checkedAt = now.toISOString();

  if (itemCount === 0) {
    return {
      httpStatus: 503 as const,
      dataSource,
      metadataReadDurationMs,
      body: {
        ok: false as const,
        status: 'unavailable' as const,
        checkedAt,
        servingSource: 'kv-read-model' as const,
        databaseStatus: 'not-probed' as const,
        reason: 'read-model-missing' as const,
        message: '공개 read model을 사용할 수 없습니다.',
        readModel: {
          available: false as const,
          itemCount: 0,
          cachedAt: null,
          ageHours: null,
          serializedBytes: null,
          budget,
        },
        latestSync: null,
      },
    };
  }

  const ageHours = getAgeHours(cachedAt, now);
  const fresh = ageHours !== null && ageHours <= MAX_SYNC_AGE_HOURS;
  const reason = cachedAt === null ? 'read-model-age-unknown' : fresh ? null : 'read-model-stale';

  return {
    httpStatus: 200 as const,
    dataSource,
    metadataReadDurationMs,
    body: {
      ok: true as const,
      status: fresh ? ('healthy' as const) : ('degraded' as const),
      checkedAt,
      servingSource: 'kv-read-model' as const,
      databaseStatus: 'not-probed' as const,
      reason,
      message: fresh
        ? 'KV read model이 최신 상태입니다.'
        : 'KV read model로 서비스를 제공 중이며 다음 snapshot 동기화를 기다리고 있습니다.',
      readModel: {
        available: true as const,
        itemCount,
        cachedAt,
        ageHours,
        serializedBytes,
        budget,
      },
      latestSync: cachedAt
        ? {
            status: 'success' as const,
            completedAt: cachedAt,
            ageHours,
          }
        : null,
    },
  };
};

export type PublicHealthReport = Awaited<ReturnType<typeof getPublicHealthReport>>;
