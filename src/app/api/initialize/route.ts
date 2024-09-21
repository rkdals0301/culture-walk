import { NextResponse } from 'next/server';
import { mapRawCultureToCulture } from '@/services/cultureService';
import prisma from '@/lib/prisma';
import { RawCulture, Culture } from '@/types/culture';

const BASE_URL = process.env.SEOUL_API_CULTURAL_URL;
const INITIAL_START_INDEX = 1;
const PAGE_SIZE = 1000;
const BATCH_SIZE = 200; // 배치 크기 조정
const MAX_CONCURRENT_BATCHES = 10; // 동시에 처리할 배치 수 제한

const fetchCultures = async (): Promise<RawCulture[]> => {
  const allCultures: RawCulture[] = [];
  let startIndex = INITIAL_START_INDEX;
  let endIndex = PAGE_SIZE;
  let totalDataCount = 0;

  try {
    console.log('fetch initial cultures data start');
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
  console.log('fetch initial cultures data successfully');
  return allCultures;
};

const updateDatabase = async () => {
  try {
    const externalData: RawCulture[] = await fetchCultures();
    console.log('Database updated start');

    // 기존 데이터베이스의 모든 데이터를 삭제하는 대신 비교
    const existingCultures = await prisma.culture.findMany();
    const existingCultureMap = new Map(
      existingCultures.map(culture => [`${culture.title}-${culture.homepageAddress}`, culture.id])
    );

    // 데이터를 배치로 나누어 저장
    const batchedData: Omit<Culture, 'id'>[][] = [];
    for (let i = 0; i < externalData.length; i += BATCH_SIZE) {
      const batch = externalData.slice(i, i + BATCH_SIZE).map(mapRawCultureToCulture);
      batchedData.push(batch);
    }

    for (let i = 0; i < batchedData.length; i += MAX_CONCURRENT_BATCHES) {
      const currentBatches = batchedData.slice(i, i + MAX_CONCURRENT_BATCHES);
      await Promise.all(
        currentBatches.map(async batch => {
          const upsertPromises = batch.map(async rawCulture => {
            const uniqueKey = `${rawCulture.title}-${rawCulture.homepageAddress}`;
            const existingCultureId = existingCultureMap.get(uniqueKey);

            // rawCulture를 Culture 형태로 매핑
            const mappedCulture = rawCulture;

            if (existingCultureId) {
              await prisma.culture.update({
                where: { id: existingCultureId },
                data: { ...mappedCulture },
              });
            } else {
              await prisma.culture.create({
                data: { ...mappedCulture },
              });
            }
          });
          await Promise.all(upsertPromises);
        })
      );
    }

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
