import { NextResponse } from 'next/server';
import { mapRawCultureToCulture } from '@/services/cultureService';
import prisma from '@/lib/prisma';
import { RawCulture } from '@/types/culture';

const BASE_URL = 'http://openapi.seoul.go.kr:8088/684e537944726b643635534d756b47/json/culturalEventInfo';
const INITIAL_START_INDEX = 1;
const PAGE_SIZE = 1000;
const BATCH_SIZE = 100; // 배치 크기
const CONCURRENT_BATCHES = 10; // 동시 배치 수

const fetchCultures = async (): Promise<RawCulture[]> => {
  const allCultures: RawCulture[] = [];
  let startIndex = INITIAL_START_INDEX;
  let endIndex = PAGE_SIZE;
  let totalDataCount = 0;

  try {
    const firstResponse = await fetch(`${BASE_URL}/${startIndex}/${endIndex}`);
    if (!firstResponse.ok) {
      throw new Error(`Failed to fetch initial cultures data: ${firstResponse.statusText}`);
    }

    const firstData = await firstResponse.json();
    totalDataCount = firstData?.culturalEventInfo?.list_total_count || 0;
    const firstCultures = firstData?.culturalEventInfo?.row || [];
    allCultures.push(...firstCultures);
    startIndex += PAGE_SIZE;
    endIndex += PAGE_SIZE;

    const requests = [];
    while (startIndex <= totalDataCount) {
      requests.push(
        fetch(`${BASE_URL}/${startIndex}/${endIndex}`).then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch cultures data: ${response.statusText}`);
          }
          return response.json();
        })
      );
      startIndex += PAGE_SIZE;
      endIndex += PAGE_SIZE;
    }

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

const updateDatabase = async () => {
  try {
    const externalData = await fetchCultures();

    // 데이터를 배치로 나누어 저장
    const batchedData: Array<Array<ReturnType<typeof mapRawCultureToCulture>>> = [];
    for (let i = 0; i < externalData.length; i += BATCH_SIZE) {
      const batch = externalData.slice(i, i + BATCH_SIZE).map(mapRawCultureToCulture);
      batchedData.push(batch);
    }

    // 데이터베이스의 모든 데이터를 삭제
    await prisma.culture.deleteMany({});

    // 트랜잭션 내에서 모든 배치 데이터를 처리
    await prisma.$transaction(async prisma => {
      const batchPromises = [];
      while (batchedData.length > 0) {
        const currentBatches = batchedData.splice(0, CONCURRENT_BATCHES);
        batchPromises.push(Promise.all(currentBatches.map(batch => prisma.culture.createMany({ data: batch }))));
      }
      await Promise.all(batchPromises);
    });

    console.log('Database updated successfully');
  } catch (error) {
    console.error('Failed to update database:', error);
  }
};

export async function POST() {
  try {
    await updateDatabase(); // 데이터베이스 업데이트 호출
    return NextResponse.json({ message: 'Database updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to update database:', error);
    return NextResponse.json({ error: 'Failed to update database' }, { status: 500 });
  }
}
