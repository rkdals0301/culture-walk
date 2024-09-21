import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const revalidate = 0;

// 현재 날짜 구하기
const today = new Date();
const utcToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

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

    return NextResponse.json(cultures);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch and store data' }, { status: 500 });
  }
}
