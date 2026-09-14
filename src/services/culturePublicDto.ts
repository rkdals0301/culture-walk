import type { CultureListItem, CultureListItemDto } from '@/types/culture';

const toIsoString = (value: Date | string) => {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid culture date value: ${String(value)}`);
  }
  return parsed.toISOString();
};

export const toCultureListItemDto = (item: CultureListItem): CultureListItemDto => ({
  id: item.id,
  classification: item.classification,
  guName: item.guName,
  isFree: item.isFree,
  lat: item.lat,
  lng: item.lng,
  mainImage: item.mainImage,
  place: item.place,
  title: item.title,
  useFee: item.useFee,
  startDate: toIsoString(item.startDate),
  endDate: toIsoString(item.endDate),
});

export const toCultureListItemDtos = (items: readonly CultureListItem[]): CultureListItemDto[] =>
  items.map(toCultureListItemDto);
