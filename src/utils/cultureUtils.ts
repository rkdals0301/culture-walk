import { format } from 'date-fns';
import { Culture, FormattedCulture } from '@/types/culture';

const formatString = (object: Culture, keys: (keyof Culture)[], separate = ', '): string => {
  const values = keys.map(key => object[key]);
  const result = values.filter(val => val !== undefined && val !== null).join(separate);

  return result;
};

const formatDisplayDate = (startDate: Date, endDate: Date) => {
  const formattedStartDate = format(startDate, 'yyyy-MM-dd'); // yyyy-mm-dd 형식으로 포맷
  const formattedEndDate = format(endDate, 'yyyy-MM-dd');

  return formattedStartDate === formattedEndDate ? formattedStartDate : `${formattedStartDate} ~ ${formattedEndDate}`;
};

export const formatCultureData = (cultures: Culture[]): FormattedCulture[] => {
  return cultures.map((culture: Culture) => ({
    ...culture,
    displayDate: formatDisplayDate(culture.startDate, culture.endDate),
    displayPlace: formatString(culture, ['classification', 'guName', 'place'], ' / '),
    displayPrice: culture.isFree === '유료' ? formatString(culture, ['isFree', 'useFee']) : culture.isFree,
  }));
};
