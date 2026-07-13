import type { FormattedCulture } from '@/types/culture';

export type CultureCategoryKey = 'all' | 'education' | 'exhibition' | 'performance' | 'festival';
export type CultureToneKey = Exclude<CultureCategoryKey, 'all'> | 'other';

export const CULTURE_CATEGORY_OPTIONS: Array<{ key: CultureCategoryKey; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'education', label: '교육·체험' },
  { key: 'exhibition', label: '전시' },
  { key: 'performance', label: '공연' },
  { key: 'festival', label: '축제' },
];

export const getCultureTone = (classification?: string | null): CultureToneKey => {
  const value = classification?.trim() ?? '';

  if (value.includes('교육') || value.includes('체험')) return 'education';
  if (value.includes('전시') || value.includes('미술')) return 'exhibition';
  if (value.includes('축제')) return 'festival';
  if (
    ['공연', '클래식', '콘서트', '연극', '무용', '뮤지컬', '오페라', '영화', '독주', '독창', '국악'].some(
      keyword => value.includes(keyword)
    )
  ) {
    return 'performance';
  }

  return 'other';
};

export const matchesCultureCategory = (classification: string | null | undefined, category: CultureCategoryKey) =>
  category === 'all' || getCultureTone(classification) === category;

export const isFreeCulture = (culture: Pick<FormattedCulture, 'isFree' | 'displayPrice'>) => {
  const value = `${culture.isFree} ${culture.displayPrice}`.toLowerCase();
  return value.includes('free') || value.includes('무료');
};
