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

const getRelevantTimestamp = (culture: CultureSchedule, referenceTimestamp: number) => {
  const startTimestamp = toTimestamp(culture.startDate);
  const endTimestamp = toTimestamp(culture.endDate);

  return startTimestamp <= referenceTimestamp ? endTimestamp : startTimestamp;
};

export const sortCulturesByRelevantDate = <T extends CultureSchedule>(
  cultures: readonly T[],
  referenceDate: Date | string = new Date()
) => {
  const referenceTimestamp = toTimestamp(referenceDate);

  return [...cultures].sort((left, right) => {
    const relevantDateDifference =
      getRelevantTimestamp(left, referenceTimestamp) - getRelevantTimestamp(right, referenceTimestamp);
    if (relevantDateDifference !== 0) {
      return relevantDateDifference;
    }

    const startDateDifference = toTimestamp(left.startDate) - toTimestamp(right.startDate);
    if (startDateDifference !== 0) {
      return startDateDifference;
    }

    const titleDifference = (left.title ?? '').localeCompare(right.title ?? '', 'ko');
    if (titleDifference !== 0) {
      return titleDifference;
    }

    return (left.id ?? 0) - (right.id ?? 0);
  });
};
