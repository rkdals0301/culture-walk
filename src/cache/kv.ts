import type { CultureCacheBinding } from '@/server/runtimeTypes';
import type { Culture, CultureSearchableListItem } from '@/types/culture';

export type { CultureCacheBinding };

const CULTURE_READ_MODEL_CACHE_KEY = 'cultures:read-model:v1';
const CULTURE_READ_MODEL_METADATA_KEY = 'cultures:read-model-meta:v1';
const CULTURE_SYNC_HEALTH_KEY = 'cultures:sync-health:v1';
const CULTURE_LIST_FALLBACK_CACHE_KEY = 'cultures:list:last:v1';
const CULTURE_LIST_FALLBACK_METADATA_KEY = 'cultures:list:last-meta:v1';
const CULTURE_DETAIL_CACHE_NAMESPACE = 'cultures:detail:last:v1';
const CULTURE_READ_MODEL_TTL_SECONDS = 60 * 60 * 24 * 14;
const CULTURE_READ_MODEL_MEMORY_TTL_MS = 60 * 1000;
const UTF8_ENCODER = new TextEncoder();
export interface CultureListFallbackMetadata {
  cachedAt: string;
  itemCount: number;
}
export interface CultureReadModel {
  cachedAt: string | null;
  items: CultureSearchableListItem[];
  revisions?: Record<string, string>;
}
export interface CultureReadModelMetadata {
  cachedAt: string;
  itemCount: number;
  serializedBytes: number | null;
}
export interface CultureSyncHealthMetadata {
  completedAt: string;
}

type StoredCultureDetail = {
  cacheVersion: string;
  culture: Culture;
};

type StoredCulturePayload = Omit<
  Culture,
  'address' | 'createdAt' | 'endDate' | 'startDate' | 'updatedAt'
> & {
  address?: string;
  createdAt?: Date | string;
  endDate: Date | string;
  startDate: Date | string;
  updatedAt?: Date | string;
};

type StoredCultureListItem = Omit<CultureSearchableListItem, 'endDate' | 'startDate'> & {
  endDate: Date | string;
  startDate: Date | string;
};

type CultureReadModelMemoryEntry = {
  value: CultureReadModel;
  expiresAt: number;
};

const cultureReadModelMemoryCache = new WeakMap<object, CultureReadModelMemoryEntry>();
const CULTURE_TEXT_FIELDS = [
  'classification',
  'date',
  'etcDescription',
  'guName',
  'homepageDetailAddress',
  'isFree',
  'mainImage',
  'homepageAddress',
  'organizationName',
  'place',
  'performerInformation',
  'programIntroduction',
  'registrationDate',
  'themeClassification',
  'register',
  'title',
  'useFee',
  'useTarget',
  'overview',
  'eventTime',
  'duration',
  'bookingPlace',
  'placeInformation',
  'contact',
  'festivalGrade',
  'discountInformation',
] as const;

const CULTURE_LIST_TEXT_FIELDS = [
  'classification',
  'guName',
  'isFree',
  'mainImage',
  'place',
  'title',
  'useFee',
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseStoredDate = (value: unknown): Date | null => {
  const date = value instanceof Date ? new Date(value.getTime()) : typeof value === 'string' ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date : null;
};

const isStoredDateInput = (value: unknown): value is Date | string => value instanceof Date || typeof value === 'string';

const hasStringFields = (value: Record<string, unknown>, fields: readonly string[]) =>
  fields.every(field => typeof value[field] === 'string');

const isPositiveSafeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

const isNonNegativeSafeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const isStringRecord = (value: unknown): value is Record<string, string> =>
  isRecord(value) && Object.values(value).every(entry => typeof entry === 'string');

const isStoredCultureListItem = (value: unknown): value is StoredCultureListItem =>
  isRecord(value) &&
  isPositiveSafeInteger(value.id) &&
  hasStringFields(value, CULTURE_LIST_TEXT_FIELDS) &&
  isFiniteNumber(value.lat) &&
  isFiniteNumber(value.lng) &&
  isStoredDateInput(value.startDate) &&
  isStoredDateInput(value.endDate) &&
  (value.searchText === undefined || typeof value.searchText === 'string');

const parseStoredCultureListItem = (value: unknown): CultureSearchableListItem | null => {
  if (!isStoredCultureListItem(value)) return null;
  const startDate = parseStoredDate(value.startDate);
  const endDate = parseStoredDate(value.endDate);
  if (!startDate || !endDate) return null;
  return { ...value, startDate, endDate };
};

const parseStoredCultureList = (value: unknown): CultureSearchableListItem[] | null => {
  if (!Array.isArray(value)) return null;

  const items: CultureSearchableListItem[] = [];
  for (const entry of value) {
    const item = parseStoredCultureListItem(entry);
    if (!item) return null;
    items.push(item);
  }
  return items;
};

const isStoredCulturePayload = (value: unknown): value is StoredCulturePayload => {
  if (
    !isRecord(value) ||
    !isPositiveSafeInteger(value.id) ||
    !hasStringFields(value, CULTURE_TEXT_FIELDS) ||
    !isFiniteNumber(value.lat) ||
    !isFiniteNumber(value.lng) ||
    !isStoredDateInput(value.startDate) ||
    !isStoredDateInput(value.endDate) ||
    (value.address !== undefined && typeof value.address !== 'string') ||
    (value.createdAt !== undefined && !isStoredDateInput(value.createdAt)) ||
    (value.updatedAt !== undefined && !isStoredDateInput(value.updatedAt))
  ) {
    return false;
  }

  return (
    Array.isArray(value.additionalInformation) &&
    value.additionalInformation.every(
      item => isRecord(item) && typeof item.name === 'string' && typeof item.text === 'string'
    ) &&
    Array.isArray(value.additionalImages) &&
    value.additionalImages.every(
      image =>
        isRecord(image) &&
        typeof image.name === 'string' &&
        typeof image.thumbnailUrl === 'string' &&
        typeof image.url === 'string'
    )
  );
};

const parseStoredCulture = (value: unknown): Culture | null => {
  if (!isStoredCulturePayload(value)) return null;

  const startDate = parseStoredDate(value.startDate);
  const endDate = parseStoredDate(value.endDate);
  const createdAt = value.createdAt === undefined ? undefined : parseStoredDate(value.createdAt);
  const updatedAt = value.updatedAt === undefined ? undefined : parseStoredDate(value.updatedAt);
  if (!startDate || !endDate || createdAt === null || updatedAt === null) return null;

  return {
    ...value,
    address: value.address ?? value.place,
    startDate,
    endDate,
    createdAt,
    updatedAt,
  };
};

const parseStoredCultureDetail = (value: unknown, expectedId: number): StoredCultureDetail | null => {
  if (!isRecord(value) || typeof value.cacheVersion !== 'string' || !value.cacheVersion) return null;
  const culture = parseStoredCulture(value.culture);
  return culture?.id === expectedId ? { cacheVersion: value.cacheVersion, culture } : null;
};

const parseCultureReadModel = (value: unknown): CultureReadModel | null => {
  if (!isRecord(value)) return null;
  if (value.cachedAt !== null && (typeof value.cachedAt !== 'string' || !parseStoredDate(value.cachedAt))) return null;
  const items = parseStoredCultureList(value.items);
  if (!items) return null;
  if (value.revisions !== undefined && !isStringRecord(value.revisions)) return null;

  return {
    cachedAt: value.cachedAt,
    items,
    revisions: value.revisions ?? {},
  };
};

const parseCultureListFallbackMetadata = (value: unknown): CultureListFallbackMetadata | null =>
  isRecord(value) &&
  typeof value.cachedAt === 'string' &&
  parseStoredDate(value.cachedAt) !== null &&
  isNonNegativeSafeInteger(value.itemCount)
    ? { cachedAt: value.cachedAt, itemCount: value.itemCount }
    : null;

const parseCultureReadModelMetadata = (value: unknown): CultureReadModelMetadata | null =>
  isRecord(value) &&
  typeof value.cachedAt === 'string' &&
  parseStoredDate(value.cachedAt) !== null &&
  isNonNegativeSafeInteger(value.itemCount) &&
  (value.serializedBytes === null ||
    isNonNegativeSafeInteger(value.serializedBytes))
    ? {
        cachedAt: value.cachedAt,
        itemCount: value.itemCount,
        serializedBytes: value.serializedBytes,
      }
    : null;

const parseCultureSyncHealthMetadata = (value: unknown): CultureSyncHealthMetadata | null =>
  isRecord(value) && typeof value.completedAt === 'string' && parseStoredDate(value.completedAt) !== null
    ? { completedAt: value.completedAt }
    : null;

const parseCacheValue = <T>(key: string, value: unknown | null, parse: (value: unknown) => T | null): T | null => {
  if (value === null) return null;
  const parsed = parse(value);
  if (parsed === null) console.error('[kv] invalid cached data', key);
  return parsed;
};

const sortObjectKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortObjectKeys((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }

  return value;
};

const stableStringify = (value: unknown) => JSON.stringify(sortObjectKeys(value));

export const createCacheKey = (namespace: string, payload: object) => `${namespace}:${stableStringify(payload)}`;

export const getSerializedUtf8ByteLength = (value: unknown) => UTF8_ENCODER.encode(JSON.stringify(value)).byteLength;

const getCultureCache = (cache?: CultureCacheBinding) => cache;

export const readKvCache = async (key: string, cacheOverride?: CultureCacheBinding): Promise<unknown | null> => {
  const cache = await getCultureCache(cacheOverride);
  if (!cache) return null;

  try {
    return (await cache.get(key, 'json')) ?? null;
  } catch (error) {
    console.error('[kv] read failed', key, error);
    return null;
  }
};

export const writeKvCache = async <T>(
  key: string,
  value: T,
  ttlSeconds: number,
  cacheOverride?: CultureCacheBinding
) => {
  const cache = await getCultureCache(cacheOverride);
  if (!cache) return false;

  try {
    await cache.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
    return true;
  } catch (error) {
    console.error('[kv] write failed', key, error);
    return false;
  }
};

export const getCultureDetailCacheKey = (id: number) => createCacheKey(CULTURE_DETAIL_CACHE_NAMESPACE, { id });

export const readCultureDetailCache = async (id: number, cacheOverride?: CultureCacheBinding) => {
  const key = getCultureDetailCacheKey(id);
  const value = await readKvCache(key, cacheOverride);
  return parseCacheValue(key, value, cachedValue => parseStoredCultureDetail(cachedValue, id));
};

export const writeCultureDetailCache = async (
  id: number,
  cacheVersion: string,
  culture: Culture,
  ttlSeconds: number,
  cacheOverride?: CultureCacheBinding
) => writeKvCache(getCultureDetailCacheKey(id), { cacheVersion, culture }, ttlSeconds, cacheOverride);

export const readCulturesListFallbackCache = async (cacheOverride?: CultureCacheBinding) => {
  const value = await readKvCache(CULTURE_LIST_FALLBACK_CACHE_KEY, cacheOverride);
  return parseCacheValue(CULTURE_LIST_FALLBACK_CACHE_KEY, value, parseStoredCultureList);
};

export const readCulturesListFallbackMetadata = async (cacheOverride?: CultureCacheBinding) => {
  const value = await readKvCache(CULTURE_LIST_FALLBACK_METADATA_KEY, cacheOverride);
  return parseCacheValue(CULTURE_LIST_FALLBACK_METADATA_KEY, value, parseCultureListFallbackMetadata);
};

export const readCultureReadModelCache = async (
  cacheOverride?: CultureCacheBinding
): Promise<CultureReadModel | null> => {
  const cache = await getCultureCache(cacheOverride);
  if (!cache) return null;

  const memoryEntry = cultureReadModelMemoryCache.get(cache);
  if (memoryEntry && memoryEntry.expiresAt > Date.now()) {
    return memoryEntry.value;
  }

  const current = await readKvCache(CULTURE_READ_MODEL_CACHE_KEY, cache);
  // An empty published read model is still authoritative. Treating it as a
  // cache miss would fall through to a stale legacy key and make every public
  // detail miss pay for another D1 read during an empty-event period.
  if (current !== null) {
    const parsed = parseCacheValue(CULTURE_READ_MODEL_CACHE_KEY, current, parseCultureReadModel);
    if (!parsed) return null;
    cultureReadModelMemoryCache.set(cache, {
      value: parsed,
      expiresAt: Date.now() + CULTURE_READ_MODEL_MEMORY_TTL_MS,
    });
    return parsed;
  }

  // Transitional compatibility for the snapshot that was seeded before the
  // dedicated read-model envelope was introduced. New syncs only publish the
  // single read-model key below, keeping KV writes bounded on the Free plan.
  const [legacyItems, legacyMetadata] = await Promise.all([
    readCulturesListFallbackCache(cache),
    readCulturesListFallbackMetadata(cache),
  ]);
  if (!legacyItems?.length) return null;

  const legacyReadModel = {
    cachedAt: legacyMetadata?.cachedAt ?? null,
    items: legacyItems,
    revisions: {},
  };
  cultureReadModelMemoryCache.set(cache, {
    value: legacyReadModel,
    expiresAt: Date.now() + CULTURE_READ_MODEL_MEMORY_TTL_MS,
  });
  return legacyReadModel;
};

export const readCultureReadModelMetadataCache = async (cacheOverride?: CultureCacheBinding) => {
  const value = await readKvCache(CULTURE_READ_MODEL_METADATA_KEY, cacheOverride);
  return parseCacheValue(CULTURE_READ_MODEL_METADATA_KEY, value, parseCultureReadModelMetadata);
};

export const writeCultureReadModelMetadataCache = async (
  metadata: CultureReadModelMetadata,
  cacheOverride?: CultureCacheBinding
) =>
  writeKvCache(
    CULTURE_READ_MODEL_METADATA_KEY,
    metadata,
    CULTURE_READ_MODEL_TTL_SECONDS,
    cacheOverride
  );

export const readCultureSyncHealthMetadataCache = async (cacheOverride?: CultureCacheBinding) => {
  const value = await readKvCache(CULTURE_SYNC_HEALTH_KEY, cacheOverride);
  return parseCacheValue(CULTURE_SYNC_HEALTH_KEY, value, parseCultureSyncHealthMetadata);
};

export const writeCultureSyncHealthMetadataCache = async (
  metadata: CultureSyncHealthMetadata,
  cacheOverride?: CultureCacheBinding
) => writeKvCache(CULTURE_SYNC_HEALTH_KEY, metadata, CULTURE_READ_MODEL_TTL_SECONDS, cacheOverride);

export const writeCultureReadModelCache = async (
  cultures: CultureSearchableListItem[],
  revisions: Record<string, string>,
  cacheOverride?: CultureCacheBinding
) => {
  const readModel = {
    cachedAt: new Date().toISOString(),
    items: cultures,
    revisions,
  } satisfies CultureReadModel;
  const serializedBytes = getSerializedUtf8ByteLength(readModel);
  const cache = await getCultureCache(cacheOverride);
  if (!cache) return { ...readModel, published: false, metadataPublished: false, serializedBytes };

  const published = await writeKvCache(
    CULTURE_READ_MODEL_CACHE_KEY,
    readModel,
    CULTURE_READ_MODEL_TTL_SECONDS,
    cache
  );
  if (published) {
    cultureReadModelMemoryCache.set(cache, {
      value: readModel,
      expiresAt: Date.now() + CULTURE_READ_MODEL_MEMORY_TTL_MS,
    });
  }
  const metadataPublished = published
    ? await writeCultureReadModelMetadataCache(
        {
          cachedAt: readModel.cachedAt,
          itemCount: cultures.length,
          serializedBytes,
        },
        cache
      )
    : false;
  return { ...readModel, published, metadataPublished, serializedBytes };
};
