import { CultureTourApiDetailsRow, NewCultureRow } from '@/db/schema';
import {
  CultureAdditionalInformation,
  CultureDetailImage,
  TourApiFestivalDetails,
} from '@/types/culture';

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&(nbsp|amp|quot|#39|lt|gt);/gi, entity => {
      const replacements: Record<string, string> = {
        nbsp: ' ',
        amp: '&',
        quot: '"',
        '#39': "'",
        lt: '<',
        gt: '>',
      };
      return replacements[entity.slice(1, -1).toLowerCase()] ?? entity;
    });

export const normalizeTourApiText = (value?: string | null) => {
  if (!value?.trim()) return '';

  return decodeHtmlEntities(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const extractTourApiUrl = (value?: string | null) => {
  if (!value?.trim()) return '';

  const decoded = decodeHtmlEntities(value);
  const href = decoded.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
  const plainUrl = decoded.match(/(?:https?:\/\/|www\.)[^\s"'<>]+/i)?.[0];
  const candidate = (href || plainUrl)?.replace(/[),.;]+$/, '');
  if (!candidate) return '';

  try {
    const url = new URL(candidate.startsWith('www.') ? `https://${candidate}` : candidate);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
};

export const normalizeTourApiImageUrl = (value?: string | null) => {
  const url = extractTourApiUrl(value);
  return url.startsWith('http://tong.visitkorea.or.kr/') ? url.replace('http://', 'https://') : url;
};

const uniqueTexts = (values: Array<string | undefined | null>) =>
  Array.from(new Set(values.map(normalizeTourApiText).filter(Boolean)));

const formatContact = (name?: string, telephone?: string) => {
  const safeName = normalizeTourApiText(name);
  const safeTelephone = normalizeTourApiText(telephone);
  if (!safeTelephone) return '';
  return safeName ? `${safeName} ${safeTelephone}` : safeTelephone;
};

export type NormalizedTourApiDetails = {
  overview: string;
  eventHomepage: string;
  bookingPlace: string;
  bookingUrl: string;
  eventPlace: string;
  placeInformation: string;
  eventTime: string;
  duration: string;
  program: string;
  subevent: string;
  useFee: string;
  useTarget: string;
  organizationName: string;
  contact: string;
  festivalGrade: string;
  discountInformation: string;
  additionalInformation: CultureAdditionalInformation[];
  additionalImages: CultureDetailImage[];
};

export const normalizeTourApiDetails = (details: TourApiFestivalDetails): NormalizedTourApiDetails => {
  const { common, intro } = details;
  const sponsor1 = normalizeTourApiText(intro?.sponsor1);
  const sponsor2 = normalizeTourApiText(intro?.sponsor2);
  const organizationName = uniqueTexts([sponsor1, sponsor2]).join(' · ');
  const contact = uniqueTexts([
    formatContact(sponsor1, intro?.sponsor1tel),
    formatContact(sponsor2, intro?.sponsor2tel),
    formatContact(common?.telname, common?.tel),
  ]).join('\n');

  const additionalInformation = details.info
    .map(item => ({
      name: normalizeTourApiText(item.infoname) || '추가 안내',
      text: normalizeTourApiText(item.infotext),
    }))
    .filter((item): item is CultureAdditionalInformation => Boolean(item.text));

  const imageUrls = new Set<string>();
  const additionalImages = details.images.flatMap(image => {
    const url = normalizeTourApiImageUrl(image.originimgurl);
    if (!url || imageUrls.has(url)) return [];

    imageUrls.add(url);
    return [
      {
        name: normalizeTourApiText(image.imgname),
        thumbnailUrl: normalizeTourApiImageUrl(image.smallimageurl) || url,
        url,
      },
    ];
  });

  const homepageSource = intro?.eventhomepage || common?.homepage;
  const bookingPlace = normalizeTourApiText(intro?.bookingplace);

  return {
    overview: normalizeTourApiText(common?.overview),
    eventHomepage: extractTourApiUrl(homepageSource),
    bookingPlace,
    bookingUrl: extractTourApiUrl(intro?.bookingplace),
    eventPlace: normalizeTourApiText(intro?.eventplace),
    placeInformation: normalizeTourApiText(intro?.placeinfo),
    eventTime: normalizeTourApiText(intro?.playtime),
    duration: normalizeTourApiText(intro?.spendtimefestival),
    program: normalizeTourApiText(intro?.program),
    subevent: normalizeTourApiText(intro?.subevent),
    useFee: normalizeTourApiText(intro?.usetimefestival),
    useTarget: normalizeTourApiText(intro?.agelimit),
    organizationName,
    contact,
    festivalGrade: normalizeTourApiText(intro?.festivalgrade),
    discountInformation: normalizeTourApiText(intro?.discountinfofestival),
    additionalInformation,
    additionalImages,
  };
};

export const classifyTourApiFee = (useFee?: string | null) => {
  const value = normalizeTourApiText(useFee);
  if (!value) return '정보 없음';

  const hasFree = value.includes('무료');
  const hasPaid = /유료|\d[\d,]*\s*원|입장료|관람료/.test(value);
  if (hasFree && hasPaid) return '부분 무료';
  if (hasFree) return '무료';
  if (hasPaid) return '유료';
  return '요금 확인';
};

export const createTourApiDetailSummary = (
  details: TourApiFestivalDetails
): Pick<
  NewCultureRow,
  | 'homepageDetailAddress'
  | 'isFree'
  | 'homepageAddress'
  | 'organizationName'
  | 'performerInformation'
  | 'programIntroduction'
  | 'useFee'
  | 'useTarget'
> => {
  const normalized = normalizeTourApiDetails(details);
  const programIntroduction = uniqueTexts([normalized.program, normalized.subevent]).join('\n\n');

  return {
    homepageDetailAddress: normalized.bookingUrl || null,
    isFree: classifyTourApiFee(normalized.useFee),
    homepageAddress: normalized.eventHomepage || null,
    organizationName: normalized.organizationName || null,
    performerInformation: normalized.eventTime || null,
    programIntroduction: programIntroduction || null,
    useFee: normalized.useFee || '요금 정보 확인 필요',
    useTarget: normalized.useTarget || '정보 없음',
  };
};

const parseJson = <T>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const parseStoredTourApiDetails = (row: CultureTourApiDetailsRow): TourApiFestivalDetails => ({
  common: parseJson(row.commonJson, {}),
  intro: parseJson(row.introJson, {}),
  info: parseJson(row.infoJson, []),
  images: parseJson(row.imagesJson, []),
  complete: row.isComplete,
});

export const serializeTourApiDetails = (details: TourApiFestivalDetails) => ({
  commonJson: JSON.stringify(details.common ?? {}),
  introJson: JSON.stringify(details.intro ?? {}),
  infoJson: JSON.stringify(details.info),
  imagesJson: JSON.stringify(details.images),
  isComplete: details.complete,
});
