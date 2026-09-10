import {
  readCultureFeedPageCache,
  readCulturesListFallbackCache,
  writeCultureFeedPageCache,
} from '@/cache/kv';
import { hasD1DailyRowReadLimitError, hasMissingSqliteTableError } from '@/server/sqliteError';
import {
  buildCultureFeedResult,
  createCultureFeedFilterKey,
  normalizeCultureFeedFilters,
} from '@/services/cultureFeed';
import { getCultureFeedPage } from '@/services/cultureFeedData';
import { CultureFeedPage } from '@/types/culture';
import { CultureCategoryKey } from '@/utils/cultureCategory';

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 20;
const PAGE_CACHE_TTL_SECONDS = 60 * 10;
const HTTP_CACHE_SECONDS = 30;
const HTTP_STALE_SECONDS = 60 * 30;
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

const responseHeaders = (source?: string) => ({
  'Cache-Control': `public, max-age=${HTTP_CACHE_SECONDS}, s-maxage=${PAGE_CACHE_TTL_SECONDS}, stale-while-revalidate=${HTTP_STALE_SECONDS}`,
  ...(source ? { 'X-Culture-Data-Source': source } : {}),
});

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
    return NextResponse.json({ error: '유효하지 않은 문화 목록 커서입니다.' }, { status: 400 });
  }

  if (cursor && cursor.filters !== filterKey) {
    return NextResponse.json({ error: '문화 목록 필터가 변경되었습니다. 처음부터 다시 불러와주세요.' }, { status: 409 });
  }

  const cursorValue = searchParams.get('cursor');
  const cachedPage = await readCultureFeedPageCache({ filters: filterKey, cursor: cursorValue, limit });
  if (cachedPage) {
    return NextResponse.json(cachedPage, { headers: responseHeaders('kv-feed-page-cache') });
  }

  try {
    const feedResult = await getCultureFeedPage({
      filters,
      limit,
      offset: cursor?.offset ?? 0,
    });
    if (!feedResult) {
      return NextResponse.json({ error: '문화 데이터 저장소가 아직 준비되지 않았습니다.' }, { status: 503 });
    }

    const offset = cursor?.offset ?? 0;
    const items = feedResult.items;
    const nextOffset = offset + items.length;
    const hasMore = nextOffset < feedResult.metadata.totalCount;
    const page: CultureFeedPage = {
      items,
      nextCursor: hasMore ? encodeCursor({ offset: nextOffset, filters: filterKey }) : null,
      hasMore,
      totalCount: feedResult.metadata.totalCount,
      freeCount: feedResult.metadata.freeCount,
      regionOptions: feedResult.metadata.regionOptions,
    };

    await writeCultureFeedPageCache(
      { filters: filterKey, cursor: cursorValue, limit },
      page,
      PAGE_CACHE_TTL_SECONDS
    );

    return NextResponse.json(page, {
      headers: responseHeaders(
        feedResult.metadata.source === 'kv-feed-metadata' ? 'd1-feed-page+kv-metadata' : 'd1-feed-page+kv-metadata-refresh'
      ),
    });
  } catch (error) {
    if (hasMissingSqliteTableError(error, 'cultures')) {
      return NextResponse.json({ error: '문화 데이터 저장소가 아직 준비되지 않았습니다.' }, { status: 503 });
    }

    if (hasD1DailyRowReadLimitError(error)) {
      const fallback = await readCulturesListFallbackCache();
      if (fallback) {
        const fallbackResult = buildCultureFeedResult(fallback, filters);
        const offset = cursor?.offset ?? 0;
        const items = fallbackResult.items.slice(offset, offset + limit);
        const nextOffset = offset + items.length;
        const hasMore = nextOffset < fallbackResult.items.length;
        const page: CultureFeedPage = {
          items,
          nextCursor: hasMore ? encodeCursor({ offset: nextOffset, filters: filterKey }) : null,
          hasMore,
          totalCount: fallbackResult.items.length,
          freeCount: fallbackResult.freeCount,
          regionOptions: fallbackResult.regionOptions,
        };

        await writeCultureFeedPageCache({ filters: filterKey, cursor: cursorValue, limit }, page, 60);
        return NextResponse.json(page, { headers: responseHeaders('kv-list-fallback') });
      }

      return NextResponse.json(
        { error: '문화 목록을 잠시 불러올 수 없습니다. 잠시 후 다시 시도해주세요.' },
        { status: 503, headers: { 'Cache-Control': 'no-store', 'X-Culture-Data-Source': 'd1-unavailable' } }
      );
    }

    console.error('문화 피드 데이터를 가져오는데 실패했습니다.', error);
    return NextResponse.json({ error: '문화 목록 데이터를 가져오는데 실패했습니다.' }, { status: 500 });
  }
}
