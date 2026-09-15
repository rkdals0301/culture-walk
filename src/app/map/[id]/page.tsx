import MapDetailSheetClient from '@/components/Map/MapDetailSheetClient';
import MapShell from '@/components/Map/MapShell';
import {
  createCultureDetailMetadata,
  createCultureEventStructuredData,
  createMissingCultureMetadata,
  getFormattedCultureDetailById,
  parseCultureId,
} from '@/server/cultureDetailSeo';
import { getRuntimeDeps, getWorkerEnv } from '@/server/cloudflare';
import { serializeJsonLd } from '@/utils/jsonLd';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const numericId = parseCultureId(id);
  if (numericId === null) return createMissingCultureMetadata(null);

  const culture = await getFormattedCultureDetailById(numericId, await getRuntimeDeps());
  if (!culture) return createMissingCultureMetadata(numericId);

  return {
    ...createCultureDetailMetadata(culture),
    robots: { index: false, follow: true },
  };
}

const MapDetailPage = async ({ params }: PageProps) => {
  const { id } = await params;
  const numericId = parseCultureId(id);
  if (numericId === null) notFound();

  const culture = await getFormattedCultureDetailById(numericId, await getRuntimeDeps());
  if (!culture) notFound();
  const env = await getWorkerEnv();

  return (
    <>
      <script
        id='event-structured-data'
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(createCultureEventStructuredData(culture)) }}
      />
      <MapShell kakaoMapAppKey={env.KAKAO_MAP_APP_KEY}>
        <MapDetailSheetClient initialCulture={culture} />
      </MapShell>
    </>
  );
};

export default MapDetailPage;
