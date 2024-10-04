import prisma from '@/lib/prisma';
import { mapRawCultureToCulture } from '@/services/cultureService';
import { Culture, RawCulture } from '@/types/culture';

import { NextResponse } from 'next/server';

const BASE_URL = process.env.SEOUL_API_CULTURAL_URL;
const INITIAL_START_INDEX = 1;
const PAGE_SIZE = 1000;
const BATCH_SIZE = 50; // 배치 크기
const CONCURRENT_BATCHES = 3; // 동시 처리 배치 수
const RETRY_LIMIT = 5; // 재시도 횟수

export const revalidate = 0;

const fetchCultures = async (): Promise<RawCulture[]> => {
  const allCultures: RawCulture[] = [];
  let startIndex = INITIAL_START_INDEX;
  let endIndex = PAGE_SIZE;
  let totalDataCount = 0;

  try {
    console.time('fetchCultures');
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
  console.timeEnd('fetchCultures');
  return allCultures;
};

const updateDatabase = async () => {
  try {
    const externalData: RawCulture[] = await fetchCultures();
    console.time('delete');
    // 데이터베이스의 모든 데이터를 삭제
    await prisma.culture.deleteMany({});
    console.timeEnd('delete');
    console.time('batchPromises');
    // 데이터를 배치로 나누어 저장
    const batchedData: Omit<Culture, 'id'>[][] = [];
    for (let i = 0; i < externalData.length; i += BATCH_SIZE) {
      const batch = externalData.slice(i, i + BATCH_SIZE).map(mapRawCultureToCulture);
      batchedData.push(batch);
    }

    // 동시 배치 처리를 위한 Promise 배열
    const batchPromises = [];
    while (batchedData.length > 0) {
      const currentBatches = batchedData.splice(0, CONCURRENT_BATCHES);
      batchPromises.push(
        ...currentBatches.map(batch => retryCreateMany(batch, RETRY_LIMIT)) // 재시도 로직 추가
      );
    }

    await Promise.all(batchPromises);
    console.timeEnd('batchPromises');
    console.log('Database updated successfully');
  } catch (error) {
    console.error('Failed to update database:', error);
  }
};

// 재시도 로직 추가
const retryCreateMany = async (batch: Omit<Culture, 'id'>[], retries: number): Promise<void> => {
  try {
    await prisma.culture.createMany({ data: batch });
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying... attempts left: ${retries}`);
      await retryCreateMany(batch, retries - 1);
    } else {
      console.error('Failed after multiple retries:', error);
      throw error;
    }
  }
};

export async function POST() {
  try {
    console.time('updateDatabase');
    await updateDatabase(); // 데이터베이스 업데이트 호출
    console.timeEnd('updateDatabase');
    return NextResponse.json({ message: 'Database updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to update database:', error);
    return NextResponse.json({ error: 'Failed to update database' }, { status: 500 });
  }
}
