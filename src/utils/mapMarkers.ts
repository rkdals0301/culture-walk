interface CoordinateItem {
  lat: number;
  lng: number;
}

export interface CoordinateGroup<T extends CoordinateItem> {
  duplicateItems: T[];
  lat: number;
  lng: number;
  primaryItem: T;
}

export const groupItemsByCoordinate = <T extends CoordinateItem>(items: readonly T[]): CoordinateGroup<T>[] => {
  const groups = new Map<string, CoordinateGroup<T>>();

  items.forEach(item => {
    const key = `${item.lat.toFixed(6)}:${item.lng.toFixed(6)}`;
    const existing = groups.get(key);

    if (existing) {
      existing.duplicateItems.push(item);
      return;
    }

    groups.set(key, {
      lat: item.lat,
      lng: item.lng,
      primaryItem: item,
      duplicateItems: [item],
    });
  });

  return Array.from(groups.values());
};
