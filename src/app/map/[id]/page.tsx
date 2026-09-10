import MapDetailSheetClient from '@/components/Map/MapDetailSheetClient';
import MapShell from '@/components/Map/MapShell';
import { getCulturePublicRead } from '@/services/cultureReadModel';
import { formatCultureData } from '@/utils/cultureUtils';
import { serializeJsonLd } from '@/utils/jsonLd';
import { OG_IMAGE_URL, SITE_NAME, SITE_URL } from '@/utils/siteMetadata';

import { cache } from 'react';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

const parseCultureId = (value: string) => (/^[1-9]\d*$/.test(value) ? Number(value) : null);
const getEventImageUrl = (mainImage?: string) => {
  const imageUrl = mainImage?.trim();
  return imageUrl && imageUrl !== '/assets/images/logo.svg' ? imageUrl : null;
};

const getCultureById = cache(async (id: number) => {
  return (await getCulturePublicRead(id)).culture;
});

const parseOfferPrice = (value?: string) => {
  if (!value) {
    return null;
  }

  const match = value.replaceAll(',', '').match(/\d+/);
  return match ? Number(match[0]) : null;
};

const toIsoDate = (value: Date | string | null | undefined) => {
  const date = value instanceof Date ? value : value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : undefined;
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const parsedId = parseCultureId(id);

  if (parsedId === null) {
    return {
      title: '행사 정보',
      description: '전국 문화행사 상세 정보',
      robots: { index: false, follow: true },
      alternates: { canonical: `/map/${id}` },
    };
  }

  const culture = await getCultureById(parsedId);
  if (!culture) {
    return {
      title: '행사 정보를 찾을 수 없습니다',
      description: '요청한 문화행사 상세 정보를 찾을 수 없습니다.',
      robots: { index: false, follow: true },
      alternates: { canonical: `/map/${parsedId}` },
    };
  }

  const formatted = formatCultureData([culture])[0];
  const title = formatted?.title || '문화행사 상세';
  const description = [formatted?.displayDate, formatted?.displayPlace, formatted?.useTarget]
    .filter(Boolean)
    .join(' · ')
    .slice(0, 155);
  const eventImageUrl = getEventImageUrl(formatted?.mainImage);
  const shareImageUrl = eventImageUrl ?? OG_IMAGE_URL;
  const openGraphImage = eventImageUrl
    ? { url: eventImageUrl, alt: title }
    : {
        url: shareImageUrl,
        width: 1200,
        height: 630,
        alt: title,
        type: 'image/png' as const,
      };

  return {
    title,
    description: description || '문화행사 상세 정보',
    alternates: {
      canonical: `/map/${parsedId}`,
    },
    openGraph: {
      type: 'article',
      locale: 'ko_KR',
      url: `/map/${parsedId}`,
      title,
      description: description || '문화행사 상세 정보',
      siteName: SITE_NAME,
      images: [openGraphImage],
      publishedTime: toIsoDate(formatted?.registrationDate),
      modifiedTime: toIsoDate(formatted?.updatedAt),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description || '문화행사 상세 정보',
      images: [shareImageUrl],
    },
    keywords: [formatted?.classification, formatted?.guName, '전국 문화행사', '지역 축제', '공연'].filter(
      Boolean
    ) as string[],
  };
}

const MapDetailPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const parsedId = parseCultureId(id);
  if (parsedId === null) {
    notFound();
  }

  const culture = await getCultureById(parsedId);
  if (!culture) {
    notFound();
  }

  const formatted = formatCultureData([culture])[0];
  if (!formatted) {
    notFound();
  }

  const eventUrl = `${SITE_URL}/map/${parsedId}`;
  const eventImageUrl = getEventImageUrl(formatted.mainImage);
  const isFree = formatted.isFree.includes('무료') || formatted.useFee?.includes('무료');
  const offerPrice = isFree ? 0 : parseOfferPrice(formatted.useFee);
  const hasEnded = formatted.endDate instanceof Date && formatted.endDate.getTime() < Date.now();
  const [addressRegion = '대한민국', addressLocality = ''] = formatted.guName.split(/\s+/).filter(Boolean);
  const eventStructuredData = serializeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': `${eventUrl}#event`,
    name: formatted.title,
    url: eventUrl,
    inLanguage: 'ko-KR',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: hasEnded ? 'https://schema.org/EventCompleted' : 'https://schema.org/EventScheduled',
    startDate: formatted.startDate instanceof Date ? formatted.startDate.toISOString() : undefined,
    endDate: formatted.endDate instanceof Date ? formatted.endDate.toISOString() : undefined,
    location: {
      '@type': 'Place',
      name: formatted.place || formatted.displayPlace,
      address: {
        '@type': 'PostalAddress',
        addressLocality,
        addressRegion,
        addressCountry: 'KR',
      },
    },
    image: [eventImageUrl ?? OG_IMAGE_URL],
    dateModified: toIsoDate(formatted.updatedAt),
    description:
      formatted.programIntroduction || formatted.etcDescription || `${formatted.displayDate} ${formatted.displayPlace}`,
    organizer: {
      '@type': 'Organization',
      name: formatted.organizationName || SITE_NAME,
      url: formatted.homepageAddress || SITE_URL,
    },
    isAccessibleForFree: isFree,
    offers:
      offerPrice !== null
        ? {
            '@type': 'Offer',
            price: offerPrice,
            priceCurrency: 'KRW',
            availability: hasEnded ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
            url: formatted.homepageDetailAddress || formatted.homepageAddress || eventUrl,
          }
        : undefined,
  });

  return (
    <>
      <script
        id='event-structured-data'
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: eventStructuredData }}
      />
      <MapShell>
        <MapDetailSheetClient initialCulture={formatted} />
      </MapShell>
    </>
  );
};

export default MapDetailPage;
