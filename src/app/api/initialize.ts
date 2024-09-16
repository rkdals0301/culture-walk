import { NextResponse } from 'next/server';
import { mapRawCultureToCulture } from '@/services/cultureService';
import { RawCulture } from '@/types/culture';
import prisma from '@/lib/prisma';

// 외부 API에서 데이터를 가져오는 함수
const fetchExternalData = async (): Promise<RawCulture[]> => {
  const response = await fetch('https://external-api.com/cultures'); // 실제 API URL로 수정
  const data = await response.json();
  return data;
};

// 데이터베이스를 업데이트하는 함수
const updateDatabase = async () => {
  try {
    // 외부 API 데이터 가져오기
    const externalData = await fetchExternalData();

    // 데이터베이스의 모든 데이터를 삭제
    await prisma.culture.deleteMany({});

    // 새로운 데이터를 데이터베이스에 저장
    for (const item of externalData) {
      const culture = mapRawCultureToCulture(item);
      await prisma.culture.create({ data: culture });
    }

    console.log('Database updated successfully');
  } catch (error) {
    console.error('Failed to update database:', error);
  }
};

// API 요청을 처리하는 함수
export async function GET() {
  try {
    await updateDatabase(); // 데이터베이스 업데이트 호출
    return NextResponse.json({ message: 'Database updated successfully' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update database' }, { status: 500 });
  }
}
