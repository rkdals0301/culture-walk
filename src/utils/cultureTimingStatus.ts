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

  const now = new Date(referenceDate);
  const start = startDate ? new Date(startDate) : null;
  const end = new Date(endDate);

  if (Number.isNaN(end.getTime()) || (start && Number.isNaN(start.getTime()))) return null;

  now.setHours(0, 0, 0, 0);
  if (start) start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffDaysToEnd = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDaysToEnd < 0) return { text: '종료', variant: 'ended' };
  if (diffDaysToEnd === 0) return { text: '오늘 마감', variant: 'urgent' };
  if (diffDaysToEnd <= 3) return { text: `D-${diffDaysToEnd} 마감임박`, variant: 'urgent' };

  if (start && start > now) {
    const diffDaysToStart = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { text: `D-${diffDaysToStart} 오픈예정`, variant: 'upcoming' };
  }

  return { text: '진행중', variant: 'ongoing' };
};
