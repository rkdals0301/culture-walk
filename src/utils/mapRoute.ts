import type { MapExploreUrlState } from '@/utils/exploreState';
import { serializeMapExploreStateToSearch } from '@/utils/exploreState';

export const getMapDetailId = (pathname?: string | null) => {
  const match = pathname?.match(/^\/map\/(\d+)$/);
  if (!match) {
    return null;
  }

  const id = Number(match[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

export const shouldRestoreMapList = (search: string) => new URLSearchParams(search).get('list') === 'open';

export const createMapExploreUrl = (path: '/map' | `/map/${number}`, state: MapExploreUrlState) => {
  const serializedSearch = serializeMapExploreStateToSearch(state);
  return serializedSearch ? `${path}?${serializedSearch}` : path;
};
