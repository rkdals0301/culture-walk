import { getCulturePublicRead } from '@/services/cultureReadModel';
import { getRuntimeDeps } from '@/server/cloudflare';
import type { RuntimeDeps } from '@/server/runtimeTypes';
import type { FormattedCultureDetail } from '@/types/culture';
import { formatCultureData } from '@/utils/cultureUtils';
import { getCultureTimingStatus } from '@/utils/cultureTimingStatus';
import { OG_IMAGE_URL, SITE_NAME, SITE_URL } from '@/utils/siteMetadata';

import { cache } from 'react';

import type { Metadata } from 'next';

export const parseCultureId = (value: string) => (/^[1-9]\d*$/.test(value) ? Number(value) : null);

export type FormattedCultureDetailLookup =
  | { status: 'found'; culture: FormattedCultureDetail }
  | { status: 'not-found' }
  | { status: 'unavailable' };

export const resolveFormattedCultureDetailLookupById = async (
  id: number,
  deps: RuntimeDeps
): Promise<FormattedCultureDetailLookup> => {
  const result = await getCulturePublicRead(id, deps);
  if (!result.culture) {
    return result.readModelAvailable ? { status: 'not-found' } : { status: 'unavailable' };
  }

  const culture = formatCultureData([result.culture])[0];
  return culture ? { status: 'found', culture } : { status: 'not-found' };
};

type CultureDetailLookupById = (id: number) => Promise<FormattedCultureDetailLookup>;

export const createCachedCultureDetailLookupById = (
  loadDeps: () => Promise<RuntimeDeps>,
  requestCache: (lookup: CultureDetailLookupById) => CultureDetailLookupById = cache
) => requestCache(async id => resolveFormattedCultureDetailLookupById(id, await loadDeps()));

export const getFormattedCultureDetailLookupById = createCachedCultureDetailLookupById(getRuntimeDeps);

export const getCultureCanonicalUrl = (id: number) => `${SITE_URL}/cultures/${id}`;

const getEventImageUrl = (mainImage?: string) => {
  const imageUrl = mainImage?.trim();
  return imageUrl && !imageUrl.includes('/assets/images/logo') ? imageUrl : null;
};

const toIsoDate = (value: Date | string | null | undefined) => {
  const date = value instanceof Date ? value : value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : undefined;
};

const toEventDate = (value: Date | string | null | undefined) => {
  const date = value instanceof Date ? value : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return undefined;

  const isCalendarDate =
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0;

  return isCalendarDate ? date.toISOString().slice(0, 10) : date.toISOString();
};

const FREE_FEE_PATTERN = /무료|free/i;
const PAID_FEE_PATTERN = /유료|입장료|관람료|\d+\s*원/i;
const CONDITIONAL_FREE_PATTERN =
  /부분\s*무료|일부|한함|회원|비회원|군민|시민|지역민|대상자?|장애인|국가유공자|경로|예매|현장|사전|예약|조건|증빙|할인|면제/i;
const AMBIGUOUS_OFFER_PATTERN =
  /무료|free|할인|면제|회원|비회원|대인|성인|청소년|어린이|아동|유아|소인|단체|개인|군민|시민|지역민|국가유공자|장애인|경로|예매|현장|사전|좌석|부터|이상|이하|별도|문의|확인|조건|증빙/i;

const parseOfferPrice = (value?: string) => {
  const fee = value?.trim();
  if (!fee || AMBIGUOUS_OFFER_PATTERN.test(fee)) return null;

  const matches = Array.from(fee.replaceAll(',', '').matchAll(/(\d+)\s*원/gi), match => Number(match[1]));
  if (matches.length !== 1 || !Number.isSafeInteger(matches[0])) return null;

  return matches[0];
};

const getFeeSignals = (culture: FormattedCultureDetail) => {
  const feeText = `${culture.isFree ?? ''} ${culture.useFee ?? ''}`.trim();
  const hasFreeSignal = FREE_FEE_PATTERN.test(feeText);
  const hasPaidSignal = PAID_FEE_PATTERN.test(feeText);
  const isConditionallyFree = hasFreeSignal && CONDITIONAL_FREE_PATTERN.test(feeText);
  const isAccessibleForFree = hasFreeSignal
    ? hasPaidSignal || isConditionallyFree
      ? undefined
      : true
    : hasPaidSignal
      ? false
      : undefined;

  return { feeText, hasFreeSignal, hasPaidSignal, isConditionallyFree, isAccessibleForFree };
};

const createCultureDescription = (culture: FormattedCultureDetail) =>
  (
    culture.overview?.trim() ||
    culture.programIntroduction?.trim() ||
    culture.etcDescription?.trim() ||
    `${culture.title} - ${culture.displayDate} (${culture.displayPlace}). 일정, 장소, 관람료, 상세 정보 안내.`
  ).slice(0, 155);

export const createMissingCultureMetadata = (id: number | null): Metadata => ({
  title: { absolute: `행사를 찾을 수 없습니다 | ${SITE_NAME}` },
  description: '요청한 문화행사 상세 정보를 찾을 수 없습니다.',
  robots: { index: false, follow: true },
  ...(id ? { alternates: { canonical: getCultureCanonicalUrl(id) } } : {}),
});

export const createUnavailableCultureMetadata = (id: number | null): Metadata => ({
  title: { absolute: `일시적으로 불러올 수 없습니다 | ${SITE_NAME}` },
  description: '문화행사 상세 정보를 일시적으로 불러올 수 없습니다. 잠시 후 다시 시도해주세요.',
  robots: { index: false, follow: false },
  ...(id ? { alternates: { canonical: getCultureCanonicalUrl(id) } } : {}),
});

export const createCultureDetailMetadata = (culture: FormattedCultureDetail): Metadata => {
  const title = `${culture.title} | ${SITE_NAME}`;
  const description = createCultureDescription(culture);
  const canonicalUrl = getCultureCanonicalUrl(culture.id);
  const eventImageUrl = getEventImageUrl(culture.mainImage);
  const shareImageUrl = eventImageUrl ?? OG_IMAGE_URL;
  const openGraphImage = eventImageUrl
    ? { url: eventImageUrl, alt: culture.title }
    : {
        url: shareImageUrl,
        width: 1200,
        height: 630,
        alt: culture.title,
        type: 'image/png' as const,
      };

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'article',
      locale: 'ko_KR',
      url: canonicalUrl,
      title,
      description,
      siteName: SITE_NAME,
      images: [openGraphImage],
      publishedTime: toIsoDate(culture.registrationDate),
      modifiedTime: toIsoDate(culture.updatedAt),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [shareImageUrl],
    },
    keywords: [culture.classification, culture.guName, '전국 문화행사', '지역 축제', '공연'].filter(Boolean),
  };
};

export const createCultureEventStructuredData = (culture: FormattedCultureDetail, now = Date.now()) => {
  const eventUrl = getCultureCanonicalUrl(culture.id);
  const eventImageUrl = getEventImageUrl(culture.mainImage);
  const { feeText, hasFreeSignal, hasPaidSignal, isConditionallyFree, isAccessibleForFree } = getFeeSignals(culture);
  const isFree = hasFreeSignal && !hasPaidSignal && !isConditionallyFree;
  const offerPrice = isFree ? 0 : hasFreeSignal ? null : parseOfferPrice(feeText);
  const endDate = toEventDate(culture.endDate);
  const hasEnded = getCultureTimingStatus(undefined, culture.endDate, new Date(now))?.variant === 'ended';
  const [addressRegion = '대한민국', addressLocality = ''] = culture.guName.split(/\s+/).filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': `${eventUrl}#event`,
    name: culture.title,
    url: eventUrl,
    inLanguage: 'ko-KR',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: hasEnded ? 'https://schema.org/EventCompleted' : 'https://schema.org/EventScheduled',
    startDate: toEventDate(culture.startDate),
    endDate,
    location: {
      '@type': 'Place',
      name: culture.place || culture.displayPlace,
      address: {
        '@type': 'PostalAddress',
        streetAddress: culture.address || undefined,
        addressLocality,
        addressRegion,
        addressCountry: 'KR',
      },
    },
    image: [eventImageUrl ?? OG_IMAGE_URL],
    dateModified: toIsoDate(culture.updatedAt),
    description: createCultureDescription(culture),
    organizer: {
      '@type': 'Organization',
      name: culture.organizationName || SITE_NAME,
      url: culture.homepageAddress || SITE_URL,
    },
    isAccessibleForFree,
    offers:
      offerPrice !== null
        ? {
            '@type': 'Offer',
            price: offerPrice,
            priceCurrency: 'KRW',
            availability: hasEnded ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
            url: culture.homepageDetailAddress || culture.homepageAddress || eventUrl,
          }
        : undefined,
  };
};
