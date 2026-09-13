import type { CultureTourApiDetailsRow } from '@/db/schema';
import type { TourApiFestivalDetails } from '@/types/culture';

const parseJson = <T>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const parseStoredTourApiDetails = (row: CultureTourApiDetailsRow): TourApiFestivalDetails => ({
  common: parseJson(row.commonJson, {}),
  intro: parseJson(row.introJson, {}),
  info: parseJson(row.infoJson, []),
  images: parseJson(row.imagesJson, []),
  complete: row.isComplete,
});

export const serializeTourApiDetails = (details: TourApiFestivalDetails) => ({
  commonJson: JSON.stringify(details.common ?? {}),
  introJson: JSON.stringify(details.intro ?? {}),
  infoJson: JSON.stringify(details.info),
  imagesJson: JSON.stringify(details.images),
  isComplete: details.complete,
});
