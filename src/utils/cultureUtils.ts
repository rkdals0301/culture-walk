import { Culture, FormattedCulture } from '@/types/culture';

import { format } from 'date-fns';

const formatString = (object: Culture, keys: (keyof Culture)[], separator = ', '): string => {
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

export const formatCultureData = (cultures: Culture[]): FormattedCulture[] => {
  return cultures.map(culture => {
    const displayPlace = formatString(culture, ['classification', 'guName', 'place'], ' / ');
    const displayPrice = culture.isFree === '유료' ? formatString(culture, ['isFree', 'useFee']) : culture.isFree;

    return {
      ...culture,
      displayDate: formatDisplayDate(culture.startDate, culture.endDate),
      displayPlace,
      displayPrice: displayPrice || '정보 없음',
    };
  });
};
