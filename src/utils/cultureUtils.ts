import { format } from 'date-fns';
import { Culture, FormattedCulture } from '@/types/culture';

const formatString = (object: Culture, keys: (keyof Culture)[], separator = ', '): string => {
  return keys
    .map(key => object[key])
    .filter(val => val != null) // `null`과 `undefined`를 함께 처리
    .join(separator);
};

const formatDisplayDate = (startDate: Date, endDate: Date) => {
  const formattedStartDate = format(startDate, 'yyyy-MM-dd'); // yyyy-mm-dd 형식으로 포맷
  const formattedEndDate = format(endDate, 'yyyy-MM-dd');

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
      displayPrice,
    };
  });
};
