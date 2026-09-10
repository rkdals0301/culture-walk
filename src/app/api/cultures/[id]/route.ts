import { getCulturePublicRead } from '@/services/cultureReadModel';

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const HTTP_CACHE_SECONDS = 60;
const HTTP_SHARED_CACHE_SECONDS = 60 * 10;
const HTTP_STALE_SECONDS = 60 * 60;

const responseHeaders = (source: string) => ({
  'Cache-Control': `public, max-age=${HTTP_CACHE_SECONDS}, s-maxage=${HTTP_SHARED_CACHE_SECONDS}, stale-while-revalidate=${HTTP_STALE_SECONDS}`,
  'X-Culture-Data-Source': source,
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'ID 파라미터가 필요합니다.' }, { status: 400 });
  }

  if (!/^[1-9]\d*$/.test(id)) {
    return NextResponse.json({ error: '유효하지 않은 ID 파라미터입니다.' }, { status: 400 });
  }

  const result = await getCulturePublicRead(Number(id));
  if (result.culture) {
    return NextResponse.json(result.culture, {
      headers: responseHeaders(result.source ?? 'kv-read-model'),
    });
  }

  if (!result.readModelAvailable) {
    return NextResponse.json(
      { error: '문화 상세 read model이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.' },
      { status: 503, headers: { 'Cache-Control': 'no-store', 'X-Culture-Data-Source': 'kv-read-model-missing' } }
    );
  }

  return NextResponse.json({ error: '해당 문화를 찾을 수 없습니다.' }, { status: 404 });
}
