const KOREA_TIME_OFFSET_MILLISECONDS = 9 * 60 * 60 * 1000;

export const getKoreaDateStartIso = (now = new Date()) => {
  const koreaTime = new Date(now.getTime() + KOREA_TIME_OFFSET_MILLISECONDS);
  return new Date(
    Date.UTC(koreaTime.getUTCFullYear(), koreaTime.getUTCMonth(), koreaTime.getUTCDate())
  ).toISOString();
};
