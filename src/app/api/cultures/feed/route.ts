import {
  buildCultureFeedResult,
  createCultureFeedFilterKey,
  type CultureFeedFilters,
  normalizeCultureFeedFilters,
} from '@/services/cultureFeed';
import {
  CULTURE_EDGE_CACHE_TAGS,
  createPublicEdgeCacheHeaders,
  NO_STORE_CACHE_HEADERS,
} from '@/server/httpCache';
import { getCulturePublicListSnapshot } from '@/services/cultureList';
import { CultureFeedPage, type CultureListItem } from '@/types/culture';
import { CultureCategoryKey } from '@/utils/cultureCategory';

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 20;
const HTTP_CACHE_SECONDS = 30;
const EDGE_CACHE_SECONDS = 60 * 10;
const HTTP_STALE_SECONDS = 60 * 30;
const HTTP_STALE_IF_ERROR_SECONDS = 60 * 60 * 24;
const VALID_CATEGORIES: CultureCategoryKey[] = ['all', 'education', 'exhibition', 'performance', 'festival'];

interface CultureFeedCursor {
  offset: number;
  filters: string;
}

const parsePositiveInteger = (value: string | null, fallback: number, maximum: number) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
};

const parseBoolean = (value: string | null) => value === '1' || value === 'true';

const encodeCursor = (cursor: CultureFeedCursor) => encodeURIComponent(JSON.stringify(cursor));

const decodeCursor = (value: string | null): CultureFeedCursor | null => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<CultureFeedCursor>;
    const offset = parsed.offset;
    if (!Number.isInteger(offset) || (offset ?? -1) < 0 || typeof parsed.filters !== 'string') {
      return null;
    }

    return { offset: offset as number, filters: parsed.filters };
  } catch {
    return null;
  }
};

const responseHeaders = (source?: string) =>
  createPublicEdgeCacheHeaders({
    browserMaxAgeSeconds: HTTP_CACHE_SECONDS,
    edgeMaxAgeSeconds: EDGE_CACHE_SECONDS,
    staleWhileRevalidateSeconds: HTTP_STALE_SECONDS,
    staleIfErrorSeconds: HTTP_STALE_IF_ERROR_SECONDS,
    source,
    tags: [CULTURE_EDGE_CACHE_TAGS.all, CULTURE_EDGE_CACHE_TAGS.list],
  });

const buildPageFromSnapshot = (
  snapshotItems: readonly CultureListItem[],
  filters: CultureFeedFilters,
  filterKey: string,
  cursor: CultureFeedCursor | null,
  limit: number
): CultureFeedPage => {
  const result = buildCultureFeedResult(snapshotItems, filters);
  const offset = cursor?.offset ?? 0;
  const items = result.items.slice(offset, offset + limit);
  const nextOffset = offset + items.length;
  const hasMore = nextOffset < result.items.length;

  return {
    items,
    nextCursor: hasMore ? encodeCursor({ offset: nextOffset, filters: filterKey }) : null,
    hasMore,
    totalCount: result.items.length,
    freeCount: result.freeCount,
    regionOptions: result.regionOptions,
  };
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const categoryValue = searchParams.get('category') ?? 'all';
  const category = VALID_CATEGORIES.includes(categoryValue as CultureCategoryKey)
    ? (categoryValue as CultureCategoryKey)
    : 'all';
  const filters = normalizeCultureFeedFilters({
    searchQuery: searchParams.get('q') ?? '',
    category,
    region: searchParams.get('region') ?? 'all',
    freeOnly: parseBoolean(searchParams.get('free')),
  });
  const filterKey = createCultureFeedFilterKey(filters);
  const limit = parsePositiveInteger(searchParams.get('limit'), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const cursor = decodeCursor(searchParams.get('cursor'));

  if (searchParams.has('cursor') && !cursor) {
    return NextResponse.json(
      { error: '유효하지 않은 문화 목록 커서입니다.' },
      { status: 400, headers: NO_STORE_CACHE_HEADERS }
    );
  }

  if (cursor && cursor.filters !== filterKey) {
    return NextResponse.json(
      { error: '문화 목록 필터가 변경되었습니다. 처음부터 다시 불러와주세요.' },
      { status: 409, headers: NO_STORE_CACHE_HEADERS }
    );
  }

  const readModel = await getCulturePublicListSnapshot();
  if (readModel) {
    const page = buildPageFromSnapshot(readModel.items, filters, filterKey, cursor, limit);
    return NextResponse.json(page, { headers: responseHeaders(readModel.source) });
  }

  return NextResponse.json(
    { error: '문화 목록 read model이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.' },
    {
      status: 503,
      headers: { ...NO_STORE_CACHE_HEADERS, 'X-Culture-Data-Source': 'kv-read-model-missing' },
    }
  );
}
