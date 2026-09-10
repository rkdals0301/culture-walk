import { readCultureDetailCache } from '@/cache/kv';
import { readCultureReadModelSnapshot } from '@/services/cultureList';
import { mapCultureListItemToCulture } from '@/services/cultureService';
import type { Culture } from '@/types/culture';

export type CulturePublicReadSource = 'kv-detail-cache' | 'kv-read-model';

export interface CulturePublicReadResult {
  culture: Culture | null;
  source: CulturePublicReadSource | null;
  readModelAvailable: boolean;
}

/**
 * Public reads intentionally never fall through to D1. D1 is the authoritative
 * sync store; KV is the published read model used by browsers, crawlers and SEO.
 */
export const getCulturePublicRead = async (id: number): Promise<CulturePublicReadResult> => {
  const [detail, snapshot] = await Promise.all([
    readCultureDetailCache(id),
    readCultureReadModelSnapshot(),
  ]);
  if (!snapshot) {
    return {
      culture: null,
      source: null,
      readModelAvailable: false,
    };
  }

  const item = snapshot.items.find(culture => culture.id === id);
  if (!item) {
    return {
      culture: null,
      source: null,
      readModelAvailable: true,
    };
  }

  const itemRevision = snapshot.revisions[String(id)];
  const detailMatchesReadModel =
    detail?.culture?.id === id &&
    (!itemRevision || detail.cacheVersion === itemRevision);
  if (detailMatchesReadModel) {
    return {
      culture: detail.culture,
      source: 'kv-detail-cache',
      readModelAvailable: true,
    };
  }

  return {
    culture: mapCultureListItemToCulture(item),
    source: 'kv-read-model',
    readModelAvailable: true,
  };
};
