import prisma from '@/lib/prisma';

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 현재 날짜 구하기
const today = new Date();
const utcToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0)); // 시간은 0으로 설정하여 날짜만 비교

export async function GET() {
  try {
    // 현재 날짜와 문화 데이터의 시작 및 종료 날짜를 비교하여 필터링
    const cultures = await prisma.culture.findMany({
      where: {
        startDate: {
          lte: utcToday, // startDate가 오늘과 같거나 이전인 경우
        },
        endDate: {
          gte: utcToday, // endDate가 오늘과 같거나 이후인 경우
        },
      },
    });

    // 성공적으로 데이터를 가져온 경우
    return NextResponse.json(cultures);
  } catch (error) {
    console.error('문화 목록 데이터를 가져오는데 실패했습니다.', error);
    return NextResponse.json({ error: '문화 목록 데이터를 가져오는데 실패했습니다.' }, { status: 500 });
  }
}
