import type { Metadata } from 'next';
import { Suspense } from 'react';

import {
  buildCultureFeedResult,
  createCultureFeedCursor,
  createCultureFeedSnapshotRevision,
  type CultureFeedFilters,
} from '@/services/cultureFeed';
import { getRuntimeDeps } from '@/server/cloudflare';
import { getCulturePublicListSnapshot } from '@/services/cultureList';
import { toCultureListItemDtos } from '@/services/culturePublicDto';
import FeedView from '@/components/Feed/FeedView';
import FeedSkeleton from '@/components/Feed/FeedSkeleton';
import { createPageSocialMetadata } from '@/utils/siteMetadata';
import { createCultureFeedClientCacheKey, createCultureFeedClientFilters } from '@/utils/cultureFeedClientRequest';
import type { CultureFeedPage } from '@/types/culture';

const TITLE = '전국 문화행사·축제·공연·전시 지도 | 문화산책';
const DESCRIPTION = '전국의 축제·공연·전시·체험 정보를 지도와 목록으로 살펴보고, 일정과 장소를 한눈에 확인하세요.';

export const metadata: Metadata = {
  title: {
    absolute: TITLE,
  },
  description: DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  ...createPageSocialMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: '/',
    imageAlt: '문화산책 - 전국 문화행사 지도',
  }),
};

export const dynamic = 'force-dynamic';

const INITIAL_FEED_LIMIT = 20;
const INITIAL_FEED_FILTERS: CultureFeedFilters = {
  searchQuery: '',
  category: 'all',
  region: 'all',
  freeOnly: false,
  sortMode: 'date',
  userLat: null,
  userLng: null,
};
const INITIAL_FEED_FILTER_KEY = createCultureFeedClientCacheKey(
  createCultureFeedClientFilters({
    searchQuery: '',
    category: 'all',
    region: 'all',
    freeOnly: false,
    sortMode: 'date',
    currentLocation: null,
  })
);

const getInitialFeedData = async (): Promise<CultureFeedPage | undefined> => {
  try {
    const snapshot = await getCulturePublicListSnapshot(await getRuntimeDeps());
    if (!snapshot) return undefined;

    const result = buildCultureFeedResult(snapshot.items, INITIAL_FEED_FILTERS);
    const items = result.items.slice(0, INITIAL_FEED_LIMIT);
    const snapshotRevision = createCultureFeedSnapshotRevision(
      snapshot.cachedAt,
      snapshot.revisions,
      snapshot.items
    );

    return {
      items: toCultureListItemDtos(items),
      nextCursor:
        items.length < result.items.length
          ? createCultureFeedCursor(items.length, INITIAL_FEED_FILTERS, snapshotRevision)
          : null,
      hasMore: items.length < result.items.length,
      totalCount: result.items.length,
      freeCount: result.freeCount,
      regionOptions: result.regionOptions,
    };
  } catch (error) {
    console.error('[feed] initial server render failed', error);
    return undefined;
  }
};

const InitialFeed = async () => {
  const initialData = await getInitialFeedData();

  return <FeedView initialData={initialData} initialDataFilterKey={INITIAL_FEED_FILTER_KEY} />;
};

const HomePage = () => (
  <Suspense fallback={
    <section role='status' className='mx-auto h-full w-full max-w-7xl overflow-y-auto bg-[var(--color-bg-primary)] px-4 py-5 sm:px-6 sm:py-6 lg:px-8'>
      <FeedSkeleton count={INITIAL_FEED_LIMIT} />
    </section>
  }>
    <InitialFeed />
  </Suspense>
);

export default HomePage;
