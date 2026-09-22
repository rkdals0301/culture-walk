import { readCultureDetailCache, writeCultureDetailCache } from '@/cache/kv';
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
import type { RuntimeDeps } from '@/server/runtimeTypes';
import { logEvent } from '@/server/structuredLog';
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

type CulturePublicReadOptions = RuntimeDeps;

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
  if (!contentRow) return null;
  const detailRow = toCultureTourApiDetailsRow(row);
  const culture = mapCultureRowToCulture(contentRow, detailRow ? parseStoredTourApiDetails(detailRow) : undefined);
  if (!culture) return null;
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
  options: CulturePublicReadOptions
): Promise<CulturePublicReadResult> => {
  const cache = options.cache;
  const d1 = options.d1;
  const [detail, snapshot] = await Promise.all([
    readCultureDetailCache(id, cache),
    getCulturePublicListSnapshot(options),
  ]);
  const item = snapshot?.items.find(culture => culture.id === id) ?? null;

  // The published list is the source of truth for currently public events.
  // Once it is available, an ID outside the list is a definitive miss: do not
  // spend a paid D1 detail read (or resurrect an old detail-cache entry).
  if (snapshot && !item) {
    return {
      culture: null,
      source: null,
      readModelAvailable: true,
    };
  }

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
      const readStartedAt = Date.now();
      const readThrough = await readCultureDetailFromD1(d1, id);
      const queryDurationMs = Date.now() - readStartedAt;
      if (readThrough) {
        let cacheWriteDurationMs = 0;
        if (cache) {
          const cacheVersion = itemRevision ?? readThrough.revision;
          const cacheWriteStartedAt = Date.now();
          await writeCultureDetailCache(id, cacheVersion, readThrough.culture, DETAIL_READ_THROUGH_TTL_SECONDS, cache);
          cacheWriteDurationMs = Date.now() - cacheWriteStartedAt;
        }

        logEvent('info', 'culture.detail.read_through', {
          id,
          queryDurationMs,
          cacheWriteDurationMs,
          readModelAvailable: Boolean(snapshot),
        });

        return {
          culture: readThrough.culture,
          source: 'd1-read-through',
          readModelAvailable: Boolean(snapshot),
        };
      }
    } catch (error) {
      logEvent('error', 'culture.detail.read_through_failed', { id }, error);
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
