import CultureDetailView from '@/components/CultureDetail/CultureDetailView';
import {
  createCultureDetailMetadata,
  createCultureEventStructuredData,
  createMissingCultureMetadata,
  createUnavailableCultureMetadata,
  getFormattedCultureDetailLookupById,
  parseCultureId,
} from '@/server/cultureDetailSeo';
import { serializeJsonLd } from '@/utils/jsonLd';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const numericId = parseCultureId(id);
  if (numericId === null) return createMissingCultureMetadata(null);

  const lookup = await getFormattedCultureDetailLookupById(numericId);
  if (lookup.status === 'unavailable') return createUnavailableCultureMetadata(numericId);
  return lookup.status === 'found'
    ? createCultureDetailMetadata(lookup.culture)
    : createMissingCultureMetadata(numericId);
}

export default async function CultureDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numericId = parseCultureId(id);
  if (numericId === null) notFound();

  const lookup = await getFormattedCultureDetailLookupById(numericId);
  if (lookup.status === 'unavailable') throw new Error('Culture detail is temporarily unavailable');
  if (lookup.status === 'not-found') notFound();
  const culture = lookup.culture;

  return (
    <>
      <script
        id='event-structured-data'
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(createCultureEventStructuredData(culture)) }}
      />
      <CultureDetailView culture={culture} />
    </>
  );
}
