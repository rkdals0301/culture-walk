import MapDashboard from '@/components/Map/MapDashboard';
import MapDetailSheetClient from '@/components/Map/MapDetailSheetClient';
import { getDb } from '@/db/client';
import { cultures } from '@/db/schema';
import { mapCultureRowToCulture } from '@/services/cultureService';
import { formatCultureData } from '@/utils/cultureUtils';

import type { Metadata } from 'next';
import { eq } from 'drizzle-orm';

const SITE_URL = process.env.SITE_URL || process.env.APP_BASE_URL || 'https://culturewalk.gangmin.dev';
const OG_IMAGE_URL = `${SITE_URL}/assets/images/logo.svg`;

const getCultureById = async (id: number) => {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const row = await db.query.cultures.findFirst({
    where: eq(cultures.id, id),
  });

  if (!row) {
    return null;
  }

  return mapCultureRowToCulture(row);
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const parsedId = Number.parseInt(id, 10);

  if (!Number.isFinite(parsedId)) {
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
    title: `${title} | 문화산책`,
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
  const parsedId = Number.parseInt(id, 10);
  const culture = Number.isFinite(parsedId) ? await getCultureById(parsedId) : null;
  const formatted = culture ? formatCultureData([culture])[0] : null;

  const eventStructuredData =
    formatted &&
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: formatted.title,
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      startDate: formatted.startDate instanceof Date ? formatted.startDate.toISOString() : undefined,
      endDate: formatted.endDate instanceof Date ? formatted.endDate.toISOString() : undefined,
      location: {
        '@type': 'Place',
        name: formatted.place || formatted.displayPlace,
        address: formatted.guName || '서울시',
      },
      image: formatted.mainImage ? [formatted.mainImage] : undefined,
      description: formatted.etcDescription || formatted.displayDate,
      organizer: {
        '@type': 'Organization',
        name: formatted.organizationName || '문화산책',
      },
      offers: {
        '@type': 'Offer',
        price: formatted.useFee || '0',
        priceCurrency: 'KRW',
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/map/${parsedId}`,
      },
    });

  return (
    <>
      {eventStructuredData && (
        <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: eventStructuredData }} />
      )}
      <MapDashboard />
      <MapDetailSheetClient />
    </>
  );
};

export default MapDetailPage;
