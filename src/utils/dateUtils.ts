const KOREA_TIME_OFFSET_MILLISECONDS = 9 * 60 * 60 * 1000;

export const toDateOrNow = (value?: string | null) => {
  if (!value) return new Date();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

export const getKoreaDateStartIso = (now = new Date()) => {
  const koreaTime = new Date(now.getTime() + KOREA_TIME_OFFSET_MILLISECONDS);
  return new Date(
    Date.UTC(koreaTime.getUTCFullYear(), koreaTime.getUTCMonth(), koreaTime.getUTCDate())
  ).toISOString();
};
