import {
  getSerializedUtf8ByteLength,
  readCultureReadModelMetadataCache,
  readCultureSyncHealthMetadataCache,
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
  const metadataPromise = readCultureReadModelMetadataCache(deps.cache);
  const snapshotPromise = readCultureReadModelSnapshot(deps.cache);
  const syncHealthPromise = readCultureSyncHealthMetadataCache(deps.cache);
  const metadata = await metadataPromise;
  const metadataReadDurationMs = performance.now() - metadataReadStartedAt;
  const [snapshot, syncHealth] = await Promise.all([snapshotPromise, syncHealthPromise]);

  const itemCount = snapshot?.items.length ?? 0;
  const cachedAt = snapshot?.cachedAt ?? null;
  const metadataMatchesSnapshot = Boolean(
    snapshot && metadata?.cachedAt === snapshot.cachedAt && metadata.serializedBytes !== null
  );
  const serializedBytes = metadataMatchesSnapshot
    ? metadata?.serializedBytes ?? null
    : snapshot
      ? getSerializedUtf8ByteLength(snapshot)
      : null;
  const dataSource = !snapshot
    ? 'kv-read-model-missing'
    : metadataMatchesSnapshot && metadata?.itemCount === itemCount
      ? 'kv-read-model-metadata'
      : metadata
        ? 'kv-read-model-metadata-repaired'
        : 'kv-read-model-fallback';

  if (snapshot?.cachedAt && snapshot.items.length > 0 && dataSource !== 'kv-read-model-metadata') {
    await writeCultureReadModelMetadataCache(
      { cachedAt: snapshot.cachedAt, itemCount, serializedBytes },
      deps.cache
    );
  }

  const budget = assessCultureReadModelBudget(serializedBytes, itemCount);
  const checkedAt = now.toISOString();
  const syncAgeHours = getAgeHours(syncHealth?.completedAt ?? null, now);
  const latestSync = syncAgeHours === null
    ? null
    : {
        status: 'success' as const,
        completedAt: syncHealth?.completedAt ?? null,
        ageHours: syncAgeHours,
      };

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
        latestSync,
      },
    };
  }

  const ageHours = getAgeHours(cachedAt, now);
  const readModelFresh = ageHours !== null && ageHours <= MAX_SYNC_AGE_HOURS;
  const syncFresh = syncAgeHours !== null && syncAgeHours <= MAX_SYNC_AGE_HOURS;
  const fresh = readModelFresh && syncFresh;
  const reason = !readModelFresh
    ? cachedAt === null
      ? 'read-model-age-unknown'
      : 'read-model-stale'
    : syncAgeHours === null
      ? 'sync-age-unknown'
      : !syncFresh
        ? 'sync-stale'
        : null;

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
        ? 'KV read model과 TourAPI 동기화가 최신 상태입니다.'
        : !readModelFresh
          ? 'KV read model의 snapshot 동기화가 오래되었습니다.'
          : syncAgeHours === null
            ? 'KV read model은 제공 중이나 TourAPI 동기화 시각을 확인할 수 없습니다.'
            : 'KV read model은 제공 중이나 TourAPI 동기화가 오래되었습니다.',
      readModel: {
        available: true as const,
        itemCount,
        cachedAt,
        ageHours,
        serializedBytes,
        budget,
      },
      latestSync,
    },
  };
};

export type PublicHealthReport = Awaited<ReturnType<typeof getPublicHealthReport>>;
