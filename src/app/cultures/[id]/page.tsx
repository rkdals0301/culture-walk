import CultureDetailView from '@/components/CultureDetail/CultureDetailView';
import { getCulturePublicRead } from '@/services/cultureReadModel';
import { formatCultureData } from '@/utils/cultureUtils';
import { serializeJsonLd } from '@/utils/jsonLd';
import { OG_IMAGE_URL, SITE_NAME, SITE_URL } from '@/utils/siteMetadata';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isFinite(numericId) || numericId <= 0) {
    return {
      title: '행사를 찾을 수 없습니다 | 문화산책',
    };
  }

  const result = await getCulturePublicRead(numericId);
  const culture = result?.culture;

  if (!culture) {
    return {
      title: '행사를 찾을 수 없습니다 | 문화산책',
    };
  }

  const [formatted] = formatCultureData([culture]);
  const title = `${formatted.title} | 문화산책`;
  const description =
    formatted.overview?.slice(0, 150) ||
    `${formatted.title} - ${formatted.displayDate} (${formatted.displayPlace}). 일정, 장소, 관람료, 상세 정보 안내.`;
  const canonicalUrl = `${SITE_URL}/cultures/${numericId}`;
  const imageUrl =
    formatted.mainImage && !formatted.mainImage.includes('/assets/images/logo') ? formatted.mainImage : OG_IMAGE_URL;

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'website',
      locale: 'ko_KR',
      url: canonicalUrl,
      title,
      description,
      siteName: SITE_NAME,
      images: [
        {
          url: imageUrl,
          alt: formatted.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function CultureDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isFinite(numericId) || numericId <= 0) {
    notFound();
  }

  const result = await getCulturePublicRead(numericId);
  const culture = result?.culture;

  if (!culture) {
    notFound();
  }

  const [formatted] = formatCultureData([culture]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: formatted.title,
    startDate: formatted.startDate ? new Date(formatted.startDate).toISOString() : undefined,
    endDate: formatted.endDate ? new Date(formatted.endDate).toISOString() : undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: formatted.place || formatted.guName || '서울',
      address: {
        '@type': 'PostalAddress',
        streetAddress: formatted.address || undefined,
        addressLocality: formatted.guName || '서울',
        addressCountry: 'KR',
      },
    },
    image: formatted.mainImage ? [formatted.mainImage] : undefined,
    description: formatted.overview || formatted.title,
    offers: {
      '@type': 'Offer',
      price: formatted.isFree === '무료' ? '0' : undefined,
      priceCurrency: 'KRW',
      availability: 'https://schema.org/InStock',
      url: formatted.homepageDetailAddress || formatted.homepageAddress || `${SITE_URL}/cultures/${formatted.id}`,
    },
  };

  return (
    <>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <CultureDetailView culture={formatted} />
    </>
  );
}
