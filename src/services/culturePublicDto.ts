import type { CultureListItem, CultureListItemDto } from '@/types/culture';

const toIsoString = (value: Date | string) => {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid culture date value: ${String(value)}`);
  }
  return parsed.toISOString();
};

export const toCultureListItemDto = (item: CultureListItem): CultureListItemDto => ({
  ...item,
  startDate: toIsoString(item.startDate),
  endDate: toIsoString(item.endDate),
});

export const toCultureListItemDtos = (items: readonly CultureListItem[]): CultureListItemDto[] =>
  items.map(toCultureListItemDto);
