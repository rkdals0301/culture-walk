import { type CultureCacheBinding, readCultureDetailCache, writeCultureDetailCache } from '@/cache/kv';
import { getWorkerEnv } from '@/server/cloudflare';
import {
  CULTURE_CONTENT_SELECT,
  CULTURE_DETAIL_SELECT,
  toCultureContentRow,
  toCultureListItem,
  toCultureTourApiDetailsRow,
} from '@/services/cultureD1Repository';
import { createCultureListItemRevision, getCulturePublicListSnapshot } from '@/services/cultureList';
import {
  mapCultureListItemToCulture,
  mapCultureRowToCulture,
} from '@/services/cultureService';
import type { D1Binding } from '@/services/cultureSyncTypes';
import { parseStoredTourApiDetails } from '@/services/tourApiDetails';
import type { Culture } from '@/types/culture';
import { getKoreaDateStartIso } from '@/utils/dateUtils';

export type CulturePublicReadSource = 'kv-detail-cache' | 'kv-read-model' | 'd1-read-through';

export interface CulturePublicReadResult {
  culture: Culture | null;
  source: CulturePublicReadSource | null;
  readModelAvailable: boolean;
}

type CulturePublicReadOptions = {
  cache?: CultureCacheBinding;
  d1?: D1Binding;
};

const DETAIL_READ_THROUGH_TTL_SECONDS = 60 * 60 * 24 * 7;

const readCultureDetailFromD1 = async (d1: D1Binding, id: number) => {
  const result = await d1
    .prepare(
      `SELECT ${CULTURE_CONTENT_SELECT}, ${CULTURE_DETAIL_SELECT}
       FROM cultures
       LEFT JOIN culture_tour_api_details details
         ON details.source_key = cultures.source_key
        AND details.is_complete = 1
        AND details.source_modified_at IS cultures.registration_date
       WHERE cultures.id = ?
         AND cultures.is_active = 1
         AND cultures.end_date >= ?
       LIMIT 1`
    )
    .bind(id, getKoreaDateStartIso())
    .all();

  const row = result.results?.[0];
  if (!row) return null;

  const contentRow = toCultureContentRow(row);
  const detailRow = toCultureTourApiDetailsRow(row);
  const culture = mapCultureRowToCulture(contentRow, detailRow ? parseStoredTourApiDetails(detailRow) : undefined);
  const listItem = toCultureListItem(row);
  if (!listItem) return null;

  return {
    culture,
    revision: createCultureListItemRevision(listItem, row.registrationDate ? String(row.registrationDate) : null),
  };
};

/**
 * Public reads are KV-first. Paid D1 is used only as a read-through recovery
 * source when the rich detail cache is missing or stale, and successful reads
 * repopulate KV so subsequent requests stay on the fast path.
 */
export const getCulturePublicRead = async (
  id: number,
  options?: CulturePublicReadOptions
): Promise<CulturePublicReadResult> => {
  const env = options ? null : await getWorkerEnv();
  const cache = options?.cache ?? (env?.CULTURE_CACHE as CultureCacheBinding | undefined);
  const d1 = options?.d1 ?? (env?.DB as D1Binding | undefined);
  const [detail, snapshot] = await Promise.all([
    readCultureDetailCache(id, cache),
    options ? getCulturePublicListSnapshot({ cache, d1 }) : getCulturePublicListSnapshot(),
  ]);
  const item = snapshot?.items.find(culture => culture.id === id) ?? null;
  const itemRevision = snapshot?.revisions[String(id)];
  const detailMatchesReadModel = detail?.culture?.id === id && (!itemRevision || detail.cacheVersion === itemRevision);
  if (detailMatchesReadModel) {
    return {
      culture: {
        ...detail.culture,
        // Older KV detail entries predate the separate address field. The
        // list read model still carries the original address, so backfill it
        // without forcing a paid refresh just to render the detail page.
        address: detail.culture.address || item?.place || detail.culture.place || '',
      },
      source: 'kv-detail-cache',
      readModelAvailable: true,
    };
  }

  if (d1) {
    try {
      const readThrough = await readCultureDetailFromD1(d1, id);
      if (readThrough) {
        if (cache) {
          const cacheVersion = itemRevision ?? readThrough.revision;
          await writeCultureDetailCache(id, cacheVersion, readThrough.culture, DETAIL_READ_THROUGH_TTL_SECONDS, cache);
        }

        return {
          culture: readThrough.culture,
          source: 'd1-read-through',
          readModelAvailable: Boolean(snapshot),
        };
      }
    } catch (error) {
      console.error(`[read-model] detail D1 read-through failed id=${id}`, error);
    }
  }

  if (!snapshot) {
    return {
      culture: null,
      source: null,
      readModelAvailable: false,
    };
  }

  if (!item) {
    return {
      culture: null,
      source: null,
      readModelAvailable: true,
    };
  }

  return {
    culture: mapCultureListItemToCulture(item),
    source: 'kv-read-model',
    readModelAvailable: true,
  };
};
