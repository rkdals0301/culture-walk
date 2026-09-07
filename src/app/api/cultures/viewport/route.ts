import { hasD1DailyRowReadLimitError, hasMissingSqliteTableError } from '@/server/sqliteError';
import { normalizeCultureFeedFilters } from '@/services/cultureFeed';
import { getCultureMapData } from '@/services/cultureMap';
import type { CultureMapBounds } from '@/types/culture';
import { CultureCategoryKey } from '@/utils/cultureCategory';

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const HTTP_CACHE_SECONDS = 60;
const HTTP_STALE_SECONDS = 300;
const VALID_CATEGORIES: CultureCategoryKey[] = ['all', 'education', 'exhibition', 'performance', 'festival'];

const parseFiniteNumber = (value: string | null) => {
  if (value === null || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseBounds = (searchParams: URLSearchParams): CultureMapBounds | null => {
  const swLat = parseFiniteNumber(searchParams.get('swLat'));
  const swLng = parseFiniteNumber(searchParams.get('swLng'));
  const neLat = parseFiniteNumber(searchParams.get('neLat'));
  const neLng = parseFiniteNumber(searchParams.get('neLng'));

  if (swLat === null || swLng === null || neLat === null || neLng === null) return null;
  if (swLat < -90 || neLat > 90 || swLng < -180 || neLng > 180) return null;
  if (swLat > neLat || swLng > neLng) return null;

  return { swLat, swLng, neLat, neLng };
};

const parseBoolean = (value: string | null) => value === '1' || value === 'true';

const parseMapLevel = (value: string | null) => {
  const parsed = parseFiniteNumber(value);
  if (parsed === null) return undefined;
  return Math.min(14, Math.max(1, Math.round(parsed)));
};

const responseHeaders = () => ({
  'Cache-Control': `public, max-age=${HTTP_CACHE_SECONDS}, s-maxage=${HTTP_CACHE_SECONDS}, stale-while-revalidate=${HTTP_STALE_SECONDS}`,
  'X-Culture-Data-Source': 'd1-viewport',
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const bounds = parseBounds(url.searchParams);

  if (!bounds) {
    return NextResponse.json({ error: '현재 지도 영역 좌표가 올바르지 않습니다.' }, { status: 400 });
  }

  const categoryValue = url.searchParams.get('category') ?? 'all';
  const category = VALID_CATEGORIES.includes(categoryValue as CultureCategoryKey)
    ? (categoryValue as CultureCategoryKey)
    : 'all';
  const filters = normalizeCultureFeedFilters({
    searchQuery: url.searchParams.get('q') ?? '',
    category,
    region: url.searchParams.get('region') ?? 'all',
    freeOnly: parseBoolean(url.searchParams.get('free')),
  });
  const level = parseMapLevel(url.searchParams.get('level'));

  try {
    const result = await getCultureMapData({ filters, bounds, level });
    if (!result) {
      return NextResponse.json({ error: '문화 데이터 저장소가 아직 준비되지 않았습니다.' }, { status: 503 });
    }

    return NextResponse.json(result, { headers: responseHeaders() });
  } catch (error) {
    if (hasMissingSqliteTableError(error, 'cultures')) {
      return NextResponse.json({ error: '문화 데이터 저장소가 아직 준비되지 않았습니다.' }, { status: 503 });
    }

    if (hasD1DailyRowReadLimitError(error)) {
      return NextResponse.json(
        { error: '지도 영역 데이터를 잠시 불러올 수 없습니다. 잠시 후 다시 시도해주세요.' },
        { status: 503, headers: { 'Cache-Control': 'no-store', 'X-Culture-Data-Source': 'd1-unavailable' } }
      );
    }

    console.error('지도 영역 문화 데이터를 가져오는데 실패했습니다.', error);
    return NextResponse.json({ error: '지도 영역 데이터를 가져오는데 실패했습니다.' }, { status: 500 });
  }
}
