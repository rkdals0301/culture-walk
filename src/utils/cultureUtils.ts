import { CultureListItem, FormattedCulture } from '@/types/culture';

import { format } from 'date-fns';

const CULTURE_PLACEHOLDER_VALUES = new Set(['-', '없음', '정보 없음', '정보없음', '미정', 'n/a', 'na', 'null']);

export const normalizeCultureContent = (value?: string | null) => (value ?? '').replace(/\s+/g, ' ').trim();

export const formatCultureDetailText = (value?: string | null) => {
  const normalized = (value ?? '').replace(/\r/g, '').trim();
  if (!normalized) return '';

  return (
    normalized
      .replace(/[ \t]*※[ \t]*/g, '\n※ ')
      // TourAPI sometimes removes the space before the next fee/schedule item.
      // Require a space after the hyphen so names such as K-POP stay intact.
      // A callback keeps time ranges such as 10:00 - 22:00 intact while still
      // separating compressed entries such as 토- 13:00~22:00.
      .replace(/([^\n])\s*-\s+(?=[가-힣A-Z]|\d{1,2}:)/g, (match, prefix: string, offset: number, source: string) => {
        const before = source.slice(0, offset + prefix.length);
        const after = source.slice(offset + match.length);
        const isTimeRange = /\d{1,2}:\d{2}\s*$/.test(before) && /^\d{1,2}:/.test(after);
        return isTimeRange ? match : `${prefix}\n- `;
      })
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
};

export const hasMeaningfulCultureValue = (value?: string | null) => {
  const normalized = normalizeCultureContent(value);
  return normalized.length > 0 && !CULTURE_PLACEHOLDER_VALUES.has(normalized.toLowerCase());
};

const CULTURE_TIME_RANGE_PATTERN = /\d{1,2}:\d{2}\s*(?:~|〜|-)\s*\d{1,2}:\d{2}/;

export const isCultureTimeRange = (value?: string | null) => CULTURE_TIME_RANGE_PATTERN.test(value ?? '');

export const getCultureTiming = (
  culture: Pick<FormattedCulture, 'eventTime' | 'duration'>
): { eventTime: string; duration: string } => {
  const eventTime = hasMeaningfulCultureValue(culture.eventTime) ? normalizeCultureContent(culture.eventTime) : '';
  const duration = hasMeaningfulCultureValue(culture.duration) ? normalizeCultureContent(culture.duration) : '';

  // TourAPI occasionally puts a venue's opening range in spendtimefestival.
  // Treat that shape as operating time so it does not appear as a false duration.
  if (!eventTime && isCultureTimeRange(duration)) return { eventTime: duration, duration: '' };
  if (isCultureTimeRange(duration)) return { eventTime, duration: '' };

  return { eventTime, duration };
};

const compactCultureContent = (value?: string | null) =>
  normalizeCultureContent(value)
    .toLowerCase()
    .replace(/[^\w가-힣]/g, '');

const getProgramContentParts = (value: string) =>
  value
    .split(/[\n\/:]+/)
    .map(compactCultureContent)
    .filter(part => part.length >= 4)
    .filter(part => !/^(?:\d+)?(?:주요|부대|메인|소비자참여)프로그램$/.test(part));

export const isCultureProgramRedundant = (overview?: string | null, program?: string | null) => {
  const normalizedOverview = compactCultureContent(overview);
  const normalizedProgram = compactCultureContent(program);
  if (!normalizedOverview || !normalizedProgram) return false;
  if (normalizedOverview === normalizedProgram) return true;
  if (normalizedOverview.includes(normalizedProgram) || normalizedProgram.includes(normalizedOverview)) return true;

  // A programme block can repeat the overview while still adding the only
  // scannable schedule. Keep those dates and venues visible to visitors.
  const hasScheduleFacts = /\d{1,2}(?:[./-]\d{1,2}){1,2}|\d{1,2}:\d{2}|\d+\s*(?:회차|일차|부)\b/.test(program ?? '');
  if (hasScheduleFacts) return false;

  const parts = getProgramContentParts(program ?? '');
  if (parts.length < 3 || normalizedOverview.length <= normalizedProgram.length * 1.35) return false;

  const matchedParts = parts.filter(part => normalizedOverview.includes(part)).length;
  return matchedParts / parts.length >= 0.5;
};

export type CultureContactSegment = { type: 'text' | 'phone'; value: string };

const CULTURE_PHONE_PATTERN = /(?:0\d{1,2}(?:(?:[-.\s])\d{3,4}){1,2}|0\d{8,9}|1\d{3}[-.\s]\d{4})/g;

export const splitCultureContact = (value?: string | null): CultureContactSegment[] => {
  const text = value ?? '';
  if (!text) return [];

  const segments: CultureContactSegment[] = [];
  let lastIndex = 0;
  CULTURE_PHONE_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = CULTURE_PHONE_PATTERN.exec(text)) !== null) {
    const index = match.index ?? 0;
    if (index > lastIndex) segments.push({ type: 'text', value: text.slice(lastIndex, index) });
    segments.push({ type: 'phone', value: match[0].replace(/[.\s]/g, '-') });
    lastIndex = index + match[0].length;
  }
  CULTURE_PHONE_PATTERN.lastIndex = 0;

  if (lastIndex < text.length) segments.push({ type: 'text', value: text.slice(lastIndex) });
  return segments;
};

export const getUniqueCultureAdditionalInformation = (
  information: FormattedCulture['additionalInformation'],
  comparedTexts: Array<string | null | undefined> = []
) => {
  const seen = new Set(comparedTexts.map(normalizeCultureContent).filter(Boolean));

  return (information ?? []).filter(item => {
    const text = normalizeCultureContent(item.text);
    if (!hasMeaningfulCultureValue(text) || seen.has(text)) return false;

    seen.add(text);
    return true;
  });
};

const formatString = (object: Partial<CultureListItem>, keys: (keyof CultureListItem)[], separator = ', '): string => {
  return keys
    .map(key => object[key])
    .filter(val => typeof val === 'string' && val.trim().length > 0)
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

export type CulturePriceTone = 'free' | 'partial' | 'paid' | 'unknown';

export const getCulturePriceTone = (
  culture: Pick<FormattedCulture, 'isFree' | 'displayPrice'> & Partial<Pick<FormattedCulture, 'useFee'>>
): CulturePriceTone => {
  const value = `${culture.isFree ?? ''} ${culture.displayPrice ?? ''} ${culture.useFee ?? ''}`.toLowerCase();

  if (value.includes('부분 무료')) return 'partial';
  if (value.includes('무료') || value.includes('free')) return 'free';
  if (value.includes('유료') || value.includes('paid')) return 'paid';
  return 'unknown';
};

const CULTURE_DETAIL_SIGNATURE_FIELDS = [
  'id',
  'title',
  'classification',
  'guName',
  'displayDate',
  'displayPrice',
  'place',
  'useFee',
  'useTarget',
  'organizationName',
  'eventTime',
  'duration',
  'address',
  'mainImage',
  'homepageAddress',
  'homepageDetailAddress',
  'overview',
  'programIntroduction',
  'bookingPlace',
  'placeInformation',
  'contact',
  'festivalGrade',
  'discountInformation',
  'additionalInformation',
  'additionalImages',
] as const satisfies readonly (keyof FormattedCulture)[];

export const createCultureDetailSignature = (culture?: Partial<FormattedCulture> | null) =>
  JSON.stringify(CULTURE_DETAIL_SIGNATURE_FIELDS.map(field => culture?.[field] ?? null));

export const formatCultureData = (cultures: CultureListItem[]): FormattedCulture[] => {
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
