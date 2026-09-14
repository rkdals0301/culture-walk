import CultureDetailView from '@/components/CultureDetail/CultureDetailView';
import {
  createCultureDetailMetadata,
  createCultureEventStructuredData,
  createMissingCultureMetadata,
  getFormattedCultureDetailById,
  parseCultureId,
} from '@/server/cultureDetailSeo';
import { getRuntimeDeps } from '@/server/cloudflare';
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

  const culture = await getFormattedCultureDetailById(numericId, await getRuntimeDeps());
  return culture ? createCultureDetailMetadata(culture) : createMissingCultureMetadata(numericId);
}

export default async function CultureDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numericId = parseCultureId(id);
  if (numericId === null) notFound();

  const culture = await getFormattedCultureDetailById(numericId, await getRuntimeDeps());
  if (!culture) notFound();

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
