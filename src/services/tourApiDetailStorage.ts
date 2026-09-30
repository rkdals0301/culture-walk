import type { CultureTourApiDetailsRow } from '@/db/schema';
import type {
  TourApiFestivalCommon,
  TourApiFestivalDetails,
  TourApiFestivalImage,
  TourApiFestivalInfo,
  TourApiFestivalIntro,
} from '@/types/culture';

const parseJson = (value: string): unknown => {
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed;
  } catch {
    return null;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseStringFields = <T extends object>(value: string, fields: readonly string[]): T => {
  const parsed = parseJson(value);
  if (!isRecord(parsed)) return {} as T;

  const result: Record<string, string> = {};
  for (const field of fields) {
    if (typeof parsed[field] === 'string') result[field] = parsed[field];
  }
  return result as T;
};

const parseStringFieldArray = <T extends object>(value: string, fields: readonly string[]): T[] => {
  const parsed = parseJson(value);
  if (!Array.isArray(parsed)) return [];

  return parsed.flatMap(entry => {
    if (!isRecord(entry)) return [];

    const result: Record<string, string> = {};
    for (const field of fields) {
      if (typeof entry[field] === 'string') result[field] = entry[field];
    }
    return [result as T];
  });
};

const COMMON_FIELDS = [
  'contentid',
  'contenttypeid',
  'firstimage',
  'firstimage2',
  'homepage',
  'overview',
  'tel',
  'telname',
] as const;

const INTRO_FIELDS = [
  'agelimit',
  'bookingplace',
  'discountinfofestival',
  'eventhomepage',
  'eventplace',
  'festivalgrade',
  'placeinfo',
  'playtime',
  'program',
  'spendtimefestival',
  'sponsor1',
  'sponsor1tel',
  'sponsor2',
  'sponsor2tel',
  'subevent',
  'usetimefestival',
] as const;

const INFO_FIELDS = ['contentid', 'contenttypeid', 'fldgubun', 'infoname', 'infotext', 'serialnum'] as const;
const IMAGE_FIELDS = [
  'contentid',
  'cpyrhtDivCd',
  'imgname',
  'originimgurl',
  'serialnum',
  'smallimageurl',
] as const;

export const parseStoredTourApiDetails = (row: CultureTourApiDetailsRow): TourApiFestivalDetails => ({
  common: parseStringFields<TourApiFestivalCommon>(row.commonJson, COMMON_FIELDS),
  intro: parseStringFields<TourApiFestivalIntro>(row.introJson, INTRO_FIELDS),
  info: parseStringFieldArray<TourApiFestivalInfo>(row.infoJson, INFO_FIELDS),
  images: parseStringFieldArray<TourApiFestivalImage>(row.imagesJson, IMAGE_FIELDS),
  complete: row.isComplete,
});

export const serializeTourApiDetails = (details: TourApiFestivalDetails) => ({
  commonJson: JSON.stringify(details.common ?? {}),
  introJson: JSON.stringify(details.intro ?? {}),
  infoJson: JSON.stringify(details.info),
  imagesJson: JSON.stringify(details.images),
  isComplete: details.complete,
});
