import { createCacheKey, getCulturesCacheVersion, readKvCache, writeKvCache } from '@/cache/kv';
import { getDb } from '@/db/client';
import { cultures } from '@/db/schema';
import { mapCultureRowToCulture } from '@/services/cultureService';
import { Culture } from '@/types/culture';

import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'ID 파라미터가 필요합니다.' }, { status: 400 });
  }

  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId)) {
    return NextResponse.json({ error: '유효하지 않은 ID 파라미터입니다.' }, { status: 400 });
  }

  try {
    const db = await getDb();
    if (!db) {
      return NextResponse.json({ error: '문화 데이터 저장소가 아직 준비되지 않았습니다.' }, { status: 404 });
    }

    const cacheVersion = await getCulturesCacheVersion();
    const cacheKey = createCacheKey('cultures:detail:v1', { version: cacheVersion, id: parsedId });

    const cached = await readKvCache<Culture>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const row = await db.query.cultures.findFirst({
      where: eq(cultures.id, parsedId),
    });

    if (!row) {
      return NextResponse.json({ error: '해당 문화를 찾을 수 없습니다.' }, { status: 404 });
    }

    const culture = mapCultureRowToCulture(row);
    await writeKvCache(cacheKey, culture, CACHE_TTL_SECONDS);

    return NextResponse.json(culture);
  } catch (error) {
    if (hasMissingCulturesTableError(error)) {
      return NextResponse.json({ error: '문화 데이터 저장소가 아직 준비되지 않았습니다.' }, { status: 404 });
    }

    console.error('문화 데이터를 가져오는데 실패했습니다.', error);
    return NextResponse.json({ error: '문화 데이터를 가져오는데 실패했습니다.' }, { status: 500 });
  }
}
