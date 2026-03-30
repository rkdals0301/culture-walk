import { createCacheKey, getCulturesCacheVersion, readKvCache, writeKvCache } from '@/cache/kv';
import { cultures } from '@/db/schema';
import { getDb } from '@/db/client';
import { mapCultureRowToCulture } from '@/services/cultureService';
import { Culture } from '@/types/culture';

import { NextResponse } from 'next/server';
import { and, asc, gte, isNotNull, lte } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const CACHE_TTL_SECONDS = 60 * 10;
const SQLITE_MISSING_TABLE_MESSAGE = 'no such table: cultures';

function hasMissingCulturesTableError(error: unknown) {
  const visited = new Set<object>();
  let current: unknown = error;

  while (current) {
    if (current instanceof Error) {
      if (current.message.includes(SQLITE_MISSING_TABLE_MESSAGE)) {
        return true;
      }

      const next = (current as Error & { cause?: unknown }).cause;
      if (!next || typeof next !== 'object') {
        current = next;
        continue;
      }

      if (visited.has(next)) {
        return false;
      }

      visited.add(next);
      current = next;
      continue;
    }

    const text = String(current);
    if (text.includes(SQLITE_MISSING_TABLE_MESSAGE)) {
      return true;
    }

    return false;
  }

  return false;
}

export async function GET() {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('D1 데이터베이스 바인딩을 찾지 못해 빈 문화 목록을 반환합니다.');
      return NextResponse.json([]);
    }

    const now = new Date();
    const utcToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)).toISOString();

    const cacheVersion = await getCulturesCacheVersion();
    const cacheKey = createCacheKey('cultures:list:v1', {
      version: cacheVersion,
      utcDate: utcToday.slice(0, 10),
    });

    const cached = await readKvCache<Culture[]>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const rows = await db
      .select()
      .from(cultures)
      .where(
        and(
          isNotNull(cultures.lat),
          isNotNull(cultures.lng),
          isNotNull(cultures.startDate),
          isNotNull(cultures.endDate),
          lte(cultures.startDate, utcToday),
          gte(cultures.endDate, utcToday)
        )
      )
      .orderBy(asc(cultures.startDate));

    const result = rows.map(mapCultureRowToCulture);
    await writeKvCache(cacheKey, result, CACHE_TTL_SECONDS);

    return NextResponse.json(result);
  } catch (error) {
    if (hasMissingCulturesTableError(error)) {
      console.warn('cultures 테이블이 없어 빈 문화 목록을 반환합니다.');
      return NextResponse.json([]);
    }

    console.error('문화 목록 데이터를 가져오는데 실패했습니다.', error);
    return NextResponse.json({ error: '문화 목록 데이터를 가져오는데 실패했습니다.' }, { status: 500 });
  }
}
