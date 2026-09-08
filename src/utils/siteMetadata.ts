import type { Metadata } from 'next';

const configuredSiteUrl = process.env.SITE_URL || process.env.APP_BASE_URL || 'https://culturewalk.gangmin.dev';

export const SITE_URL = configuredSiteUrl.replace(/\/+$/, '');
export const SITE_NAME = '문화산책';
export const OG_IMAGE_VERSION = '20260908-4';
export const OG_IMAGE_URL = `${SITE_URL}/assets/images/og-image.png?v=${OG_IMAGE_VERSION}`;
export const SEARCH_THUMBNAIL_URL = `${SITE_URL}/assets/images/search-thumbnail.png?v=${OG_IMAGE_VERSION}`;

interface PageSocialMetadataOptions {
  title: string;
  description: string;
  path: string;
  imageAlt: string;
}

export const createPageSocialMetadata = ({
  title,
  description,
  path,
  imageAlt,
}: PageSocialMetadataOptions): Pick<Metadata, 'openGraph' | 'twitter'> => ({
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: path,
    title,
    description,
    siteName: SITE_NAME,
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: imageAlt,
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [
      {
        url: OG_IMAGE_URL,
        alt: imageAlt,
      },
    ],
  },
});
