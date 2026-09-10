import type { MetadataRoute } from 'next';

import { BRAND_ASSET_VERSION, SITE_NAME, SITE_URL } from '@/utils/siteMetadata';

const manifest = (): MetadataRoute.Manifest => ({
  name: SITE_NAME,
  short_name: '문화산책',
  description: '전국의 축제·공연·전시·체험 행사를 지도에서 찾아보는 문화행사 탐색 서비스',
  id: SITE_URL,
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait-primary',
  lang: 'ko-KR',
  background_color: '#f9fafb',
  theme_color: '#3182F6',
  categories: ['travel', 'lifestyle'],
  icons: [
    {
      src: `/icon-192x192.png?v=${BRAND_ASSET_VERSION}`,
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: `/icon-512x512.png?v=${BRAND_ASSET_VERSION}`,
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
  ],
});

export default manifest;
