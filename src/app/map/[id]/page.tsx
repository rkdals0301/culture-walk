import MapDashboard from '@/components/Map/MapDashboard';
import MapDetailSheetClient from '@/components/Map/MapDetailSheetClient';
import { getDb } from '@/db/client';
import { cultures } from '@/db/schema';
import { mapCultureRowToCulture } from '@/services/cultureService';
import { formatCultureData } from '@/utils/cultureUtils';

import { cache } from 'react';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { and, eq } from 'drizzle-orm';

const SITE_URL = process.env.SITE_URL || process.env.APP_BASE_URL || 'https://culturewalk.gangmin.dev';
const OG_IMAGE_URL = `${SITE_URL}/assets/images/og-image.png`;
const parseCultureId = (value: string) => (/^[1-9]\d*$/.test(value) ? Number(value) : null);

const getCultureById = cache(async (id: number) => {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const row = await db.query.cultures.findFirst({
    where: and(eq(cultures.id, id), eq(cultures.isActive, true)),
  });

  if (!row) {
    return null;
  }

  return mapCultureRowToCulture(row);
});

const parseOfferPrice = (value?: string) => {
  if (!value) {
    return null;
  }

  const match = value.replaceAll(',', '').match(/\d+/);
  return match ? Number(match[0]) : null;
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const parsedId = parseCultureId(id);

  if (parsedId === null) {
    return {
      title: '행사 정보',
      description: '서울 문화행사 상세 정보',
      robots: { index: false, follow: true },
      alternates: { canonical: `/map/${id}` },
    };
  }

  const culture = await getCultureById(parsedId);
  if (!culture) {
    return {
      title: '행사 정보를 찾을 수 없습니다',
      description: '요청한 서울 문화행사 상세 정보를 찾을 수 없습니다.',
      robots: { index: false, follow: true },
      alternates: { canonical: `/map/${parsedId}` },
    };
  }

  const formatted = formatCultureData([culture])[0];
  const title = formatted?.title || '서울 문화행사 상세';
  const description = [formatted?.displayDate, formatted?.displayPlace, formatted?.useTarget]
    .filter(Boolean)
    .join(' · ')
    .slice(0, 155);

  return {
    title,
    description: description || '서울 문화행사 상세 정보',
    alternates: {
      canonical: `/map/${parsedId}`,
    },
    openGraph: {
      type: 'article',
      locale: 'ko_KR',
      url: `/map/${parsedId}`,
      title,
      description: description || '서울 문화행사 상세 정보',
      siteName: '문화산책',
      images: [
        {
          url: formatted?.mainImage || OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description || '서울 문화행사 상세 정보',
      images: [formatted?.mainImage || OG_IMAGE_URL],
    },
    keywords: [formatted?.classification, formatted?.guName, '서울 문화행사', '전시', '공연'].filter(
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
  const isFree = formatted.isFree.includes('무료') || formatted.useFee?.includes('무료');
  const offerPrice = isFree ? 0 : parseOfferPrice(formatted.useFee);
  const hasEnded = formatted.endDate instanceof Date && formatted.endDate.getTime() < Date.now();
  const eventStructuredData = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: formatted.title,
    url: eventUrl,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: hasEnded ? 'https://schema.org/EventCompleted' : 'https://schema.org/EventScheduled',
    startDate: formatted.startDate instanceof Date ? formatted.startDate.toISOString() : undefined,
    endDate: formatted.endDate instanceof Date ? formatted.endDate.toISOString() : undefined,
    location: {
      '@type': 'Place',
      name: formatted.place || formatted.displayPlace,
      address: {
        '@type': 'PostalAddress',
        addressLocality: formatted.guName || '서울특별시',
        addressRegion: '서울특별시',
        addressCountry: 'KR',
      },
    },
    image: formatted.mainImage ? [formatted.mainImage] : undefined,
    description:
      formatted.programIntroduction || formatted.etcDescription || `${formatted.displayDate} ${formatted.displayPlace}`,
    organizer: {
      '@type': 'Organization',
      name: formatted.organizationName || '문화산책',
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
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: eventStructuredData }} />
      <MapDashboard />
      <MapDetailSheetClient initialCulture={formatted} />
    </>
  );
};

export default MapDetailPage;
