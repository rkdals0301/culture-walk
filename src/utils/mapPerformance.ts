export const MAP_INTERACTION_DEBOUNCE_MS = 250;

/**
 * The first viewport/data publication should never pay an interaction debounce.
 * Debouncing is only useful after the map is already interactive and the user
 * is panning, zooming, or changing filters.
 */
export const getMapInteractionDelayMs = (hasCompletedInitialWork: boolean) =>
  hasCompletedInitialWork ? MAP_INTERACTION_DEBOUNCE_MS : 0;
