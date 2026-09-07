import { readCultureFeedMetadataCache, writeCultureFeedMetadataCache } from '@/cache/kv';
import { getDb } from '@/db/client';
import { cultures } from '@/db/schema';
import type { CultureFeedMetadata, CultureListItem } from '@/types/culture';
import {
  createCultureFeedFilterKey,
  type CultureFeedFilters,
  normalizeCultureFeedFilters,
} from '@/services/cultureFeed';
import {
  CULTURE_LIST_SELECTION,
  CULTURE_REGION_OPTIONS,
  getCultureBaseConditions,
  getCultureFreeCondition,
  getCultureRelevantDateExpression,
  mapCultureListRowToItem,
  type CultureListSelectionRow,
} from '@/services/cultureQuery';
import { getKoreaDateStartIso } from '@/utils/dateUtils';

import { and, asc, sql } from 'drizzle-orm';

const METADATA_CACHE_TTL_SECONDS = 60 * 10;

type CultureDatabase = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export type CultureFeedMetadataSource = 'kv-feed-metadata' | 'd1-feed-metadata';

export interface CultureFeedMetadataResult extends CultureFeedMetadata {
  source: CultureFeedMetadataSource;
}

export interface CultureFeedPageResult {
  items: CultureListItem[];
  metadata: CultureFeedMetadataResult;
}

const toCount = (value: number | string | null | undefined) => {
  const count = Number(value ?? 0);
  return Number.isFinite(count) && count >= 0 ? count : 0;
};

const queryCultureFeedMetadata = async (
  db: CultureDatabase,
  filters: CultureFeedFilters,
  filterKey: string
): Promise<CultureFeedMetadataResult> => {
  const koreaToday = getKoreaDateStartIso();
  const where = and(...getCultureBaseConditions(filters, koreaToday));
  const rows = await db
    .select({
      totalCount: sql<number>`COUNT(*)`,
      freeCount: sql<number>`SUM(CASE WHEN ${getCultureFreeCondition()} THEN 1 ELSE 0 END)`,
    })
    .from(cultures)
    .where(where);

  const metadata: CultureFeedMetadata = {
    totalCount: toCount(rows[0]?.totalCount),
    freeCount: toCount(rows[0]?.freeCount),
    regionOptions: [...CULTURE_REGION_OPTIONS],
  };

  await writeCultureFeedMetadataCache(filterKey, metadata, METADATA_CACHE_TTL_SECONDS);

  return { ...metadata, source: 'd1-feed-metadata' };
};

export const getCultureFeedMetadata = async (
  db: CultureDatabase,
  input: CultureFeedFilters
): Promise<CultureFeedMetadataResult> => {
  const filters = normalizeCultureFeedFilters(input);
  const filterKey = createCultureFeedFilterKey(filters);
  const cached = await readCultureFeedMetadataCache(filterKey);

  if (cached) {
    return { ...cached, source: 'kv-feed-metadata' };
  }

  return queryCultureFeedMetadata(db, filters, filterKey);
};

export const getCultureFeedPage = async (input: {
  filters: CultureFeedFilters;
  limit: number;
  offset: number;
}): Promise<CultureFeedPageResult | null> => {
  const db = await getDb();
  if (!db) return null;

  const filters = normalizeCultureFeedFilters(input.filters);
  const koreaToday = getKoreaDateStartIso();
  const where = and(...getCultureBaseConditions(filters, koreaToday));
  const metadataPromise = getCultureFeedMetadata(db, filters);
  const pagePromise = db
    .select(CULTURE_LIST_SELECTION)
    .from(cultures)
    .where(where)
    .orderBy(
      asc(getCultureRelevantDateExpression(koreaToday)),
      asc(cultures.startDate),
      asc(cultures.title),
      asc(cultures.id)
    )
    .limit(input.limit)
    .offset(input.offset);

  const [metadata, rows] = await Promise.all([metadataPromise, pagePromise]);

  return {
    items: (rows as CultureListSelectionRow[]).map(mapCultureListRowToItem),
    metadata,
  };
};
