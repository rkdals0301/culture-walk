import type { CultureDisplayFields, CultureListItem } from '@/types/culture';
import { toDateOrNull } from '@/utils/dateUtils';

type CultureDisplayTextField = 'classification' | 'guName' | 'place';

const formatString = (
  object: Partial<Pick<CultureListItem, CultureDisplayTextField>>,
  keys: CultureDisplayTextField[],
  separator = ', '
): string => {
  return keys
    .map(key => object[key])
    .filter(val => typeof val === 'string' && val.trim().length > 0)
    .join(separator);
};

const toValidDate = (value: Date | string) => {
  return toDateOrNull(value);
};

const formatDate = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (startDate: Date | string, endDate: Date | string) => {
  const safeStartDate = toValidDate(startDate);
  const safeEndDate = toValidDate(endDate);
  if (!safeStartDate || !safeEndDate) return '날짜 확인 필요';
  const formattedStartDate = formatDate(safeStartDate);
  const formattedEndDate = formatDate(safeEndDate);

  return formattedStartDate === formattedEndDate ? formattedStartDate : `${formattedStartDate} ~ ${formattedEndDate}`;
};

export type CulturePriceTone = 'free' | 'partial' | 'paid' | 'unknown';

type CultureDisplayInput = Omit<CultureListItem, 'startDate' | 'endDate'> & {
  startDate: Date | string;
  endDate: Date | string;
};

type CulturePriceInput = Pick<CultureListItem, 'isFree' | 'useFee'> &
  Partial<Pick<CultureDisplayFields, 'displayPrice'>>;

export const getCulturePriceTone = (culture: CulturePriceInput): CulturePriceTone => {
  const value = `${culture.isFree ?? ''} ${culture.displayPrice ?? ''} ${culture.useFee ?? ''}`.toLowerCase();
  const hasFree = /무료|free/i.test(value);
  const hasPaid = /유료|paid|[1-9][\d,]*\s*원/i.test(value);

  if (value.includes('부분 무료') || (hasFree && hasPaid)) return 'partial';
  if (hasFree) return 'free';
  if (hasPaid) return 'paid';
  return 'unknown';
};

export const formatCultureData = <T extends CultureDisplayInput>(cultures: T[]): Array<T & CultureDisplayFields> => {
  return cultures.map(culture => {
    const displayPlace = formatString(culture, ['classification', 'guName', 'place'], ' / ');
    const displayPrice = (() => {
      if (culture.isFree === '무료' || culture.isFree === '부분 무료') return culture.isFree;
      if (culture.isFree === '유료') return '유료 · 요금 안내';
      if (culture.isFree === '요금 확인') return '요금 확인';
      if (culture.isFree === '정보 없음') return '요금 정보 확인';
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
