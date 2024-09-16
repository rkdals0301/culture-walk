import { NextResponse } from 'next/server';
import { mapRawCultureToCulture } from '@/services/cultureService';
import prisma from '@/lib/prisma';
import { RawCulture } from '@/types/culture';

const BASE_URL = '/api/684e537944726b643635534d756b47/json/culturalEventInfo';
const INITIAL_START_INDEX = 1;
const PAGE_SIZE = 1000;

export const fetchCultures = async (): Promise<RawCulture[]> => {
  const allCultures: RawCulture[] = [];
  let startIndex = INITIAL_START_INDEX;
  let endIndex = PAGE_SIZE;
  let totalDataCount = 0;

  try {
    // 첫 번째 페이지 요청
    const firstResponse = await fetch(`${BASE_URL}/${startIndex}/${endIndex}`);
    if (!firstResponse.ok) {
      throw new Error('Failed to fetch initial cultures data');
    }

    const firstData = await firstResponse.json();
    totalDataCount = firstData?.culturalEventInfo?.list_total_count || 0;
    const firstCultures = firstData?.culturalEventInfo?.row || [];
    allCultures.push(...firstCultures);
    startIndex += PAGE_SIZE;
    endIndex += PAGE_SIZE;

    // 추가 페이지 요청을 위한 배열
    const requests = [];
    while (startIndex <= totalDataCount) {
      requests.push(
        fetch(`${BASE_URL}/${startIndex}/${endIndex}`).then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch cultures data');
          }
          return response.json();
        })
      );
      startIndex += PAGE_SIZE;
      endIndex += PAGE_SIZE;
    }

    // 모든 요청의 응답을 기다림
    const responses = await Promise.all(requests);
    for (const data of responses) {
      const cultures = data?.culturalEventInfo?.row || [];
      allCultures.push(...cultures);
    }
  } catch (error) {
    console.error('Error fetching cultures:', error);
  }

  return allCultures;
};

// 기존 `updateDatabase` 함수에서 `fetchCultures` 사용
const updateDatabase = async () => {
  try {
    // 외부 API 데이터 가져오기
    const externalData = await fetchCultures();

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

// API 요청을 처리하는 함수 (POST 메서드 사용)
export async function POST() {
  try {
    await updateDatabase(); // 데이터베이스 업데이트 호출
    return NextResponse.json({ message: 'Database updated successfully' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update database' }, { status: 500 });
  }
}
