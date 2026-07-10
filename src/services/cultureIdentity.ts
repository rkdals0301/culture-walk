import { NewCultureRow } from '@/db/schema';

const SOURCE_KEY_SEPARATOR = '\u001f';

const normalizeKeyPart = (value: string | null | undefined) => value?.trim() ?? '';

type CultureIdentityFields = Pick<
  NewCultureRow,
  'title' | 'startDate' | 'endDate' | 'place' | 'guName' | 'organizationName'
>;

export const createCultureSourceKey = (culture: CultureIdentityFields) =>
  `culture:${[
    culture.title,
    culture.startDate,
    culture.endDate,
    culture.place,
    culture.guName,
    culture.organizationName,
  ]
    .map(normalizeKeyPart)
    .join(SOURCE_KEY_SEPARATOR)}`;
