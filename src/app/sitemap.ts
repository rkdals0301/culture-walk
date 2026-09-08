import { getDb } from '@/db/client';
import { cultures } from '@/db/schema';
import { getKoreaDateStartIso } from '@/utils/dateUtils';
import { SITE_URL } from '@/utils/siteMetadata';

import type { MetadataRoute } from 'next';

import { and, asc, eq, gte } from 'drizzle-orm';

// D1 is available only at request time in the Cloudflare worker, not during the Next build.
export const dynamic = 'force-dynamic';

const STATIC_ENTRIES: MetadataRoute.Sitemap = [
  {
    url: SITE_URL,
    changeFrequency: 'daily',
    priority: 1,
  },
  {
    url: `${SITE_URL}/map`,
    changeFrequency: 'daily',
    priority: 0.9,
  },
  {
    url: `${SITE_URL}/about`,
    changeFrequency: 'monthly',
    priority: 0.6,
  },
  {
    url: `${SITE_URL}/contact`,
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  {
    url: `${SITE_URL}/privacy`,
    changeFrequency: 'yearly',
    priority: 0.3,
  },
];

const parseLastModified = (value: string) => {
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? `${value.replace(' ', 'T')}Z` : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const toSitemapImage = (value: string | null) => {
  const imageUrl = value?.trim();
  if (!imageUrl) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(imageUrl);
    return parsedUrl.protocol === 'https:' ? parsedUrl.toString() : undefined;
  } catch {
    return undefined;
  }
};

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV !== 'production') {
      return STATIC_ENTRIES;
    }

    throw new Error('사이트맵 생성을 위한 D1 데이터베이스 바인딩을 찾을 수 없습니다.');
  }

  const rows = await db
    .select({
      id: cultures.id,
      mainImage: cultures.mainImage,
      updatedAt: cultures.updatedAt,
    })
    .from(cultures)
    .where(and(eq(cultures.isActive, true), gte(cultures.endDate, getKoreaDateStartIso())))
    .orderBy(asc(cultures.id));

  const cultureEntries: MetadataRoute.Sitemap = rows.map(row => {
    const image = toSitemapImage(row.mainImage);

    return {
      url: `${SITE_URL}/map/${row.id}`,
      lastModified: parseLastModified(row.updatedAt),
      changeFrequency: 'daily',
      priority: 0.8,
      ...(image ? { images: [image] } : {}),
    };
  });

  return [...STATIC_ENTRIES, ...cultureEntries];
};

export default sitemap;
