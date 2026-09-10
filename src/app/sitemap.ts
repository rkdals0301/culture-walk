import { getCulturePublicListSnapshot } from '@/services/cultureList';
import { SITE_URL } from '@/utils/siteMetadata';

import type { MetadataRoute } from 'next';

// The sitemap is generated from the same KV-first read model as the public app.
// Paid D1 is only used to recover a missing KV model, not on the normal crawler path.
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

const parseLastModified = (value: string | null) => {
  if (!value) return undefined;
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
  const snapshot = await getCulturePublicListSnapshot();
  if (!snapshot) return STATIC_ENTRIES;
  const lastModified = parseLastModified(snapshot.cachedAt);

  const cultureEntries: MetadataRoute.Sitemap = [...snapshot.items]
    .sort((left, right) => left.id - right.id)
    .map(row => {
    const image = toSitemapImage(row.mainImage);

    return {
      url: `${SITE_URL}/map/${row.id}`,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: 'daily',
      priority: 0.8,
      ...(image ? { images: [image] } : {}),
    };
    });

  return [...STATIC_ENTRIES, ...cultureEntries];
};

export default sitemap;
