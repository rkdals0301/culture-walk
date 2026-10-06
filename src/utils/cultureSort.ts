import { calculateDistanceMeters, type GeoPoint } from '@/utils/geo';

interface CultureSchedule {
  endDate: Date | string;
  id?: number;
  startDate: Date | string;
  title?: string;
}

const toTimestamp = (value: Date | string) => {
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
};

export const sortCulturesByRelevantDate = <T extends CultureSchedule>(
  cultures: readonly T[],
  referenceDate: Date | string = new Date()
) => {
  const referenceTimestamp = toTimestamp(referenceDate);

  return cultures
    .map(culture => {
      const startTimestamp = toTimestamp(culture.startDate);
      return {
        culture,
        startTimestamp,
        relevantTimestamp: startTimestamp <= referenceTimestamp ? toTimestamp(culture.endDate) : startTimestamp,
      };
    })
    .sort((left, right) => {
      const relevantDateDifference = left.relevantTimestamp - right.relevantTimestamp;
      if (relevantDateDifference !== 0) {
        return relevantDateDifference;
      }

      const startDateDifference = left.startTimestamp - right.startTimestamp;
      if (startDateDifference !== 0) {
        return startDateDifference;
      }

      const titleDifference = (left.culture.title ?? '').localeCompare(right.culture.title ?? '', 'ko');
      if (titleDifference !== 0) {
        return titleDifference;
      }

      return (left.culture.id ?? 0) - (right.culture.id ?? 0);
    })
    .map(({ culture }) => culture);
};

export const sortCulturesByDistance = <T extends GeoPoint>(cultures: readonly T[], currentLocation: GeoPoint): T[] =>
  cultures
    .map(culture => ({ culture, distance: calculateDistanceMeters(currentLocation, culture) }))
    .sort((left, right) => left.distance - right.distance)
    .map(({ culture }) => culture);
