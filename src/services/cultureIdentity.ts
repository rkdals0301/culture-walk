export const TOUR_API_SOURCE_KEY_PREFIX = 'tourapi:';

export const isTourApiSourceKey = (sourceKey: string | null | undefined): sourceKey is string =>
  /^tourapi:\d+$/.test(sourceKey?.trim() ?? '');

export const createTourApiSourceKey = (contentId: string) => {
  const normalizedContentId = contentId.trim();
  if (!/^\d+$/.test(normalizedContentId)) {
    throw new Error(`TourAPI contentid가 유효하지 않습니다: ${contentId}`);
  }

  return `${TOUR_API_SOURCE_KEY_PREFIX}${normalizedContentId}`;
};
