import { getCulturePublicRead } from '@/services/cultureReadModel';
import type { RuntimeDeps } from '@/server/runtimeTypes';
import type { FormattedCultureDetail } from '@/types/culture';
import { formatCultureData } from '@/utils/cultureUtils';
import { OG_IMAGE_URL, SITE_NAME, SITE_URL } from '@/utils/siteMetadata';

import { cache } from 'react';

import type { Metadata } from 'next';

export const parseCultureId = (value: string) => (/^[1-9]\d*$/.test(value) ? Number(value) : null);

export const getFormattedCultureDetailById = cache(async (id: number, deps: RuntimeDeps) => {
  const culture = (await getCulturePublicRead(id, deps)).culture;
  if (!culture) return null;
  return formatCultureData([culture])[0] ?? null;
});

export const getCultureCanonicalUrl = (id: number) => `${SITE_URL}/cultures/${id}`;

const getEventImageUrl = (mainImage?: string) => {
  const imageUrl = mainImage?.trim();
  return imageUrl && !imageUrl.includes('/assets/images/logo') ? imageUrl : null;
};

const toIsoDate = (value: Date | string | null | undefined) => {
  const date = value instanceof Date ? value : value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : undefined;
};

const parseOfferPrice = (value?: string) => {
  if (!value) return null;
  const match = value.replaceAll(',', '').match(/\d+/);
  return match ? Number(match[0]) : null;
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
  const isFree = culture.isFree.includes('무료') || culture.useFee?.includes('무료');
  const offerPrice = isFree ? 0 : parseOfferPrice(culture.useFee);
  const endDate = toIsoDate(culture.endDate);
  const hasEnded = endDate ? new Date(endDate).getTime() < now : false;
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
    startDate: toIsoDate(culture.startDate),
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
    isAccessibleForFree: isFree,
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
