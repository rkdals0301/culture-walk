import { type MapCameraState, normalizeMapCameraState } from '@/utils/exploreState';

let feedScrollTop = 0;
let mapListScrollTop = 0;
let mapCamera: MapCameraState | null = null;

const normalizeScrollTop = (value: number) => (Number.isFinite(value) ? Math.max(0, value) : 0);

export const getFeedScrollTop = () => feedScrollTop;
export const setFeedScrollTop = (value: number) => {
  feedScrollTop = normalizeScrollTop(value);
};

export const getMapListScrollTop = () => mapListScrollTop;
export const setMapListScrollTop = (value: number) => {
  mapListScrollTop = normalizeScrollTop(value);
};

export const getMapCamera = () => mapCamera;
export const setMapCamera = (value: MapCameraState | null) => {
  mapCamera = normalizeMapCameraState(value);
};

export const resetExploreNavigationMemory = () => {
  feedScrollTop = 0;
  mapListScrollTop = 0;
  mapCamera = null;
};
