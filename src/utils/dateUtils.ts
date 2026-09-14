const KOREA_TIME_OFFSET_MILLISECONDS = 9 * 60 * 60 * 1000;

export const toDateOrNull = (value?: Date | string | null) => {
  if (!value) return null;

  const parsed = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getKoreaDateStartIso = (now = new Date()) => {
  const koreaTime = new Date(now.getTime() + KOREA_TIME_OFFSET_MILLISECONDS);
  return new Date(
    Date.UTC(koreaTime.getUTCFullYear(), koreaTime.getUTCMonth(), koreaTime.getUTCDate())
  ).toISOString();
};
