import { DAY_MILLISECONDS, getKoreaDayTimestamp, getUtcDayTimestamp, toDateOrNull } from '@/utils/dateUtils';

export type CultureTimingStatusVariant = 'ended' | 'urgent' | 'upcoming' | 'ongoing';

export interface CultureTimingStatus {
  text: string;
  variant: CultureTimingStatusVariant;
}

export const getCultureTimingStatus = (
  startDate?: Date | string | null,
  endDate?: Date | string | null,
  referenceDate: Date = new Date()
): CultureTimingStatus | null => {
  if (!endDate) return null;

  const now = toDateOrNull(referenceDate);
  const hasStartDate = Boolean(startDate);
  const start = hasStartDate ? toDateOrNull(startDate) : null;
  const end = toDateOrNull(endDate);

  if (!now || !end || (hasStartDate && !start)) return null;

  const nowDay = getKoreaDayTimestamp(now);
  const startDay = start ? getUtcDayTimestamp(start) : null;
  const endDay = getUtcDayTimestamp(end);
  if (nowDay === null || endDay === null || (start && startDay === null)) return null;

  const diffDaysToEnd = (endDay - nowDay) / DAY_MILLISECONDS;

  if (diffDaysToEnd < 0) return { text: '종료', variant: 'ended' };
  if (diffDaysToEnd === 0) return { text: '오늘 마감', variant: 'urgent' };
  if (diffDaysToEnd <= 3) return { text: `D-${diffDaysToEnd} 마감임박`, variant: 'urgent' };

  if (start && startDay !== null && startDay > nowDay) {
    const diffDaysToStart = (startDay - nowDay) / DAY_MILLISECONDS;
    return { text: `D-${diffDaysToStart} 오픈예정`, variant: 'upcoming' };
  }

  return { text: '진행중', variant: 'ongoing' };
};
