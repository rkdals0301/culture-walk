import prisma from '@/lib/prisma';

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;

  if (!id) {
    return NextResponse.json({ error: 'ID 파라미터가 필요합니다.' }, { status: 400 });
  }

  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId)) {
    return NextResponse.json({ error: '유효하지 않은 ID 파라미터입니다.' }, { status: 400 });
  }

  try {
    const culture = await prisma.culture.findUnique({
      where: {
        id: parsedId,
      },
    });

    if (!culture) {
      return NextResponse.json({ error: '해당 문화를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json(culture);
  } catch (error) {
    console.error('문화 데이터를 가져오는데 실패했습니다.', error);
    return NextResponse.json({ error: '문화 데이터를 가져오는데 실패했습니다.' }, { status: 500 });
  }
}
