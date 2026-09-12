import { getFeedScrollTop, setFeedScrollTop } from '@/utils/exploreNavigationMemory';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseFeedViewportBehaviorOptions {
  cultureCount: number;
  hasMore: boolean;
  isInitialLoading: boolean;
  error: unknown;
  loadMore: () => Promise<unknown> | unknown;
}

export const useFeedViewportBehavior = ({
  cultureCount,
  hasMore,
  isInitialLoading,
  error,
  loadMore,
}: UseFeedViewportBehaviorOptions) => {
  const feedContentRef = useRef<HTMLDivElement>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    setShowScrollTop(scrollTop > 300);
    setFeedScrollTop(scrollTop);
  }, []);

  const rememberScrollPosition = useCallback(() => {
    if (feedContentRef.current) {
      setFeedScrollTop(feedContentRef.current.scrollTop);
    }
  }, []);

  const handleScrollToTop = useCallback(() => {
    feedContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const savedScrollTop = getFeedScrollTop();
    if (savedScrollTop > 0 && feedContentRef.current && cultureCount > 0) {
      feedContentRef.current.scrollTop = savedScrollTop;
    }
  }, [cultureCount]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const focusSearch = () => {
      const feedContent = feedContentRef.current;
      if (feedContent) {
        feedContent.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      setTimeout(() => {
        const input = document.getElementById('feed-search-input') as HTMLInputElement | null;
        input?.focus();
        input?.select();
      }, 100);
    };

    const params = new URLSearchParams(window.location.search);
    if (params.get('focus') === 'search') focusSearch();

    window.addEventListener('cw:focus-feed-search', focusSearch);
    return () => window.removeEventListener('cw:focus-feed-search', focusSearch);
  }, []);

  useEffect(() => {
    const root = feedContentRef.current;
    const sentinel = loadMoreSentinelRef.current;
    if (!root || !sentinel || !hasMore || isInitialLoading || error) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) void loadMore();
      },
      { root, rootMargin: '720px 0px', threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [error, hasMore, isInitialLoading, loadMore]);

  return {
    feedContentRef,
    loadMoreSentinelRef,
    showScrollTop,
    handleScroll,
    handleScrollToTop,
    rememberScrollPosition,
  };
};
