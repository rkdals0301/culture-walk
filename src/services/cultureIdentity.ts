import { NewCultureRow } from '@/db/schema';

const SOURCE_KEY_SEPARATOR = '\u001f';

const normalizeKeyPart = (value: string | null | undefined) => value?.trim() ?? '';

type CultureIdentityFields = Pick<
  NewCultureRow,
  'title' | 'startDate' | 'endDate' | 'place' | 'guName' | 'organizationName' | 'homepageAddress'
>;

export const TOUR_API_SOURCE_KEY_PREFIX = 'tourapi:';

export const createTourApiSourceKey = (contentId: string) => {
  const normalizedContentId = contentId.trim();
  if (!/^\d+$/.test(normalizedContentId)) {
    throw new Error(`TourAPI contentid가 유효하지 않습니다: ${contentId}`);
  }

  return `${TOUR_API_SOURCE_KEY_PREFIX}${normalizedContentId}`;
};

export const createCultureSourceKey = (culture: CultureIdentityFields) => {
  return `culture:${[
    culture.title,
    culture.startDate,
    culture.endDate,
    culture.place,
    culture.guName,
    culture.organizationName,
  ]
    .map(normalizeKeyPart)
    .join(SOURCE_KEY_SEPARATOR)}`;
};
