import { NewCultureRow } from '@/db/schema';

const SOURCE_KEY_SEPARATOR = '\u001f';

const normalizeKeyPart = (value: string | null | undefined) => value?.trim() ?? '';

type CultureIdentityFields = Pick<
  NewCultureRow,
  'title' | 'startDate' | 'endDate' | 'place' | 'guName' | 'organizationName' | 'homepageAddress'
>;

export const extractSeoulCultureCode = (homepageAddress: string | null | undefined) => {
  const value = homepageAddress?.trim();
  if (!value) {
    return null;
  }

  try {
    const cultureCode = new URL(value, 'https://culture.seoul.go.kr').searchParams.get('cultcode')?.trim();
    return cultureCode && /^\d+$/.test(cultureCode) ? cultureCode : null;
  } catch {
    return null;
  }
};

export const createCultureSourceKey = (culture: CultureIdentityFields) => {
  const cultureCode = extractSeoulCultureCode(culture.homepageAddress);
  if (cultureCode) {
    return `culture:seoul:${cultureCode}`;
  }

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
