import { CultureListItem, FormattedCulture } from '@/types/culture';

import { format } from 'date-fns';

const formatString = (object: Partial<CultureListItem>, keys: (keyof CultureListItem)[], separator = ', '): string => {
  return keys
    .map(key => object[key])
    .filter(val => val != null) // `null`과 `undefined`를 함께 처리
    .join(separator);
};

const toValidDate = (value: Date | string) => {
  if (value instanceof Date) return value;

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  return new Date();
};

const formatDisplayDate = (startDate: Date | string, endDate: Date | string) => {
  const safeStartDate = toValidDate(startDate);
  const safeEndDate = toValidDate(endDate);

  const formattedStartDate = format(safeStartDate, 'yyyy-MM-dd'); // yyyy-mm-dd 형식으로 포맷
  const formattedEndDate = format(safeEndDate, 'yyyy-MM-dd');

  return formattedStartDate === formattedEndDate ? formattedStartDate : `${formattedStartDate} ~ ${formattedEndDate}`;
};

export const formatCultureData = (cultures: CultureListItem[]): FormattedCulture[] => {
  return cultures.map(culture => {
    const displayPlace = formatString(culture, ['classification', 'guName', 'place'], ' / ');
    const displayPrice = (() => {
      if (culture.isFree === '무료' || culture.isFree === '부분 무료') return culture.isFree;
      if (culture.isFree === '유료') return '유료 · 요금 안내';
      if (culture.isFree === '요금 확인') return '요금 확인';
      return culture.isFree;
    })();

    return {
      ...culture,
      displayDate: formatDisplayDate(culture.startDate, culture.endDate),
      displayPlace,
      displayPrice: displayPrice || '정보 없음',
    };
  });
};
