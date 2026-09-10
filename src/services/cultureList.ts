import {
  type CultureCacheBinding,
  readCultureReadModelCache,
  writeCultureReadModelCache,
} from '@/cache/kv';
import { getWorkerEnv } from '@/server/cloudflare';
import { normalizeCultureClassification, normalizeCultureCoordinates } from '@/services/cultureService';
import {
  type D1Binding,
  KOREA_LAT_MAX,
  KOREA_LAT_MIN,
  KOREA_LNG_MAX,
  KOREA_LNG_MIN,
} from '@/services/cultureSyncTypes';
import { CultureListItem } from '@/types/culture';
import { sortCulturesByRelevantDate } from '@/utils/cultureSort';
import { getKoreaDateStartIso } from '@/utils/dateUtils';

export type CultureListSnapshotSource = 'kv-read-model' | 'd1-read-through';

export interface CultureListSnapshot {
  items: CultureListItem[];
  source: CultureListSnapshotSource;
  cachedAt: string | null;
  revisions: Record<string, string>;
}

const toDateOrNow = (value?: string | null) => {
  if (!value) return new Date();

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date();
  return parsed;
};

export const filterCurrentCultureListItems = (
  items: readonly CultureListItem[],
  referenceDate: Date = new Date()
) => {
  const koreaToday = new Date(getKoreaDateStartIso(referenceDate)).getTime();

  return items.filter(item => {
    const endDate = new Date(item.endDate).getTime();
    return Number.isFinite(endDate) && endDate >= koreaToday;
  });
};

export const readCultureReadModelSnapshot = async (
  cacheOverride?: CultureCacheBinding
): Promise<CultureListSnapshot | null> => {
  const readModel = await readCultureReadModelCache(cacheOverride);
  if (!readModel?.items.length) return null;

  return {
    items: filterCurrentCultureListItems(readModel.items),
    source: 'kv-read-model',
    cachedAt: readModel.cachedAt,
    revisions: readModel.revisions ?? {},
  };
};

const hashCultureListItem = (item: CultureListItem) => {
  const payload = JSON.stringify([
    item.classification,
    item.endDate,
    item.guName,
    item.isFree,
    item.lat,
    item.lng,
    item.mainImage,
    item.place,
    item.startDate,
    item.title,
    item.useFee,
  ]);
  let hash = 2166136261;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

export const createCultureListItemRevision = (item: CultureListItem, sourceModifiedAt?: string | null) =>
  `${sourceModifiedAt ?? ''}:${hashCultureListItem(item)}`;

const queryCultureListFromD1 = async (d1: D1Binding) => {
  const koreaToday = getKoreaDateStartIso();
  const result = await d1
    .prepare(
      `SELECT id, classification, end_date AS endDate, gu_name AS guName, is_free AS isFree,
              lat, lng, main_image AS mainImage, place, start_date AS startDate, title, use_fee AS useFee,
              registration_date AS sourceModifiedAt
       FROM cultures
       WHERE is_active = 1
         AND lat IS NOT NULL
         AND lng IS NOT NULL
         AND start_date IS NOT NULL
         AND end_date IS NOT NULL
         AND (
           (lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?)
           OR (lng BETWEEN ? AND ? AND lat BETWEEN ? AND ?)
         )
         AND end_date >= ?`
    )
    .bind(
      KOREA_LAT_MIN,
      KOREA_LAT_MAX,
      KOREA_LNG_MIN,
      KOREA_LNG_MAX,
      KOREA_LAT_MIN,
      KOREA_LAT_MAX,
      KOREA_LNG_MIN,
      KOREA_LNG_MAX,
      koreaToday
    )
    .all();

  const revisions: Record<string, string> = {};
  const items = (result.results ?? []).flatMap(row => {
    const id = Number(row.id);
    const lat = Number(row.lat);
    const lng = Number(row.lng);
    if (!Number.isInteger(id) || !Number.isFinite(lat) || !Number.isFinite(lng)) return [];

    const coordinates = normalizeCultureCoordinates(lat, lng);
    const item = {
      id,
      classification: normalizeCultureClassification(String(row.classification ?? '')),
      endDate: toDateOrNow(String(row.endDate ?? row.startDate ?? '')),
      guName: String(row.guName ?? ''),
      isFree: String(row.isFree ?? ''),
      lat: coordinates.lat,
      lng: coordinates.lng,
      mainImage: String(row.mainImage ?? '/assets/images/logo.svg'),
      place: String(row.place ?? ''),
      startDate: toDateOrNow(String(row.startDate ?? '')),
      title: String(row.title ?? ''),
      useFee: String(row.useFee ?? ''),
    } satisfies CultureListItem;
    revisions[String(id)] = createCultureListItemRevision(item, String(row.sourceModifiedAt ?? ''));
    return [item];
  });

  return { items: sortCulturesByRelevantDate(items, koreaToday), revisions };
};

export const refreshCultureListSnapshotCache = async (options: {
  cache?: CultureCacheBinding;
  d1: D1Binding;
}) => {
  const { items, revisions } = await queryCultureListFromD1(options.d1);

  const readModel = await writeCultureReadModelCache(items, revisions, options.cache);
  console.info(
    `[read-model] publish ${readModel.published ? 'completed' : 'failed'} items=${items.length} cachedAt=${readModel.cachedAt}`
  );
  return {
    items,
    cachedAt: readModel.cachedAt,
    revisions,
    published: readModel.published,
  };
};

type CulturePublicListReadOptions = {
  cache?: CultureCacheBinding;
  d1?: D1Binding;
};

let cultureListReadThroughPromise: Promise<CultureListSnapshot | null> | null = null;

const readCultureListFromD1AndWarmCache = async (
  d1: D1Binding,
  cache?: CultureCacheBinding
): Promise<CultureListSnapshot | null> => {
  try {
    const publication = await refreshCultureListSnapshotCache({ d1, cache });
    if (!publication.items.length) return null;

    return {
      items: filterCurrentCultureListItems(publication.items),
      source: 'd1-read-through',
      cachedAt: publication.published ? publication.cachedAt : null,
      revisions: publication.revisions,
    };
  } catch (error) {
    console.error('[read-model] D1 read-through failed', error);
    return null;
  }
};

/**
 * Public list reads stay KV-first. On a KV miss, Paid D1 acts as a read-through
 * recovery source and the successful result is published back to KV. Runtime
 * misses share one in-flight rebuild so a cold cache does not stampede D1.
 */
export const getCulturePublicListSnapshot = async (
  options?: CulturePublicListReadOptions
): Promise<CultureListSnapshot | null> => {
  const env = options ? null : await getWorkerEnv();
  const cache = options?.cache ?? (env?.CULTURE_CACHE as CultureCacheBinding | undefined);
  const cached = await readCultureReadModelSnapshot(cache);
  if (cached) return cached;

  const d1 = options?.d1 ?? (env?.DB as D1Binding | undefined);
  if (!d1) return null;

  if (options) {
    return readCultureListFromD1AndWarmCache(d1, cache);
  }

  if (!cultureListReadThroughPromise) {
    cultureListReadThroughPromise = readCultureListFromD1AndWarmCache(d1, cache).finally(() => {
      cultureListReadThroughPromise = null;
    });
  }

  return cultureListReadThroughPromise;
};
