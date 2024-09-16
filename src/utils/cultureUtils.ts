import { Culture, FormattedCulture } from '@/types/culture';

const formatString = (object: Culture, keys: (keyof Culture)[], separate = ', '): string => {
  const values = keys.map(key => object[key]);
  const result = values.filter(val => val !== undefined && val !== null).join(separate);
  return result;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (startDate: string, endDate: string) => {
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);
  return formattedStartDate === formattedEndDate ? formattedStartDate : `${formattedStartDate} ~ ${formattedEndDate}`;
};

export const formatCultureData = (cultures: Culture[]): FormattedCulture[] => {
  // 현재 날짜
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 필터링을 위한 날짜 변환 함수
  const isWithinRange = (startDate: string, endDate: string): boolean => {
    const start = new Date(startDate.split(' ')[0]);
    const end = new Date(endDate.split(' ')[0]);
    return today >= start && today <= end;
  };

  // 필터링된 문화 데이터
  const filteredCultures = cultures.filter(culture => isWithinRange(culture.startDate, culture.endDate));

  // 데이터 매핑
  const mappedCultures = filteredCultures.map((culture: Culture) => {
    return {
      ...culture,
      displayDate: formatDisplayDate(culture.startDate, culture.endDate),
      displayPlace: formatString(culture, ['classification', 'guName', 'place'], ' / '),
      displayPrice: culture.isFree === '유료' ? formatString(culture, ['isFree', 'useFee']) : culture.isFree,
    };
  });

  return mappedCultures;
};
