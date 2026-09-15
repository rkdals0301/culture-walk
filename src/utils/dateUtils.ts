const KOREA_TIME_OFFSET_MILLISECONDS = 9 * 60 * 60 * 1000;
const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

export const toDateOrNull = (value?: Date | string | null) => {
  if (!value) return null;

  const parsed = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Culture dates are stored as UTC-midnight values representing a Korean
 * calendar date. Keep the day calculation independent from the runtime's
 * local timezone so SSR and browser hydration produce the same result.
 */
export const getUtcDayTimestamp = (date: Date) => {
  if (Number.isNaN(date.getTime())) return null;

  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

export const getKoreaDayTimestamp = (date: Date) => {
  if (Number.isNaN(date.getTime())) return null;

  const koreaTime = new Date(date.getTime() + KOREA_TIME_OFFSET_MILLISECONDS);
  return getUtcDayTimestamp(koreaTime);
};

export { DAY_MILLISECONDS };

export const getKoreaDateStartIso = (now = new Date()) => {
  const koreaTime = new Date(now.getTime() + KOREA_TIME_OFFSET_MILLISECONDS);
  return new Date(
    Date.UTC(koreaTime.getUTCFullYear(), koreaTime.getUTCMonth(), koreaTime.getUTCDate())
  ).toISOString();
};
