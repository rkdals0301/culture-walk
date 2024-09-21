import { NextResponse } from 'next/server';
import { mapRawCultureToCulture } from '@/services/cultureService';
import prisma from '@/lib/prisma';
import { RawCulture, Culture } from '@/types/culture';

const BASE_URL = process.env.SEOUL_API_CULTURAL_URL;
const INITIAL_START_INDEX = 1;
const PAGE_SIZE = 1000;
const BATCH_SIZE = 100; // 배치 크기
// const CONCURRENT_BATCHES = 1; // 동시 처리 배치 수
// const RETRY_LIMIT = 3; // 재시도 횟수

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
    const externalData: RawCulture[] = await fetchCultures();

    // 기존 데이터베이스의 모든 데이터를 삭제하는 대신 비교
    const existingCultures = await prisma.culture.findMany();

    // 데이터를 배치로 나누어 저장
    const batchedData: Omit<Culture, 'id'>[][] = [];
    for (let i = 0; i < externalData.length; i += BATCH_SIZE) {
      const batch = externalData.slice(i, i + BATCH_SIZE).map(mapRawCultureToCulture);
      batchedData.push(batch);
    }

    for (const batch of batchedData) {
      const upsertPromises = batch.map(async rawCulture => {
        const uniqueKey = `${rawCulture.title}-${rawCulture.homepageAddress}`;
        const existingCulture = existingCultures.find(
          culture => `${culture.title}-${culture.homepageAddress}` === uniqueKey
        );

        // rawCulture를 Culture 형태로 매핑
        const mappedCulture = rawCulture;

        if (existingCulture) {
          await prisma.culture.update({
            where: { id: existingCulture.id }, // 존재할 경우 업데이트
            data: { ...mappedCulture },
          });
        } else {
          await prisma.culture.create({
            data: { ...mappedCulture }, // 존재하지 않을 경우 생성
          });
        }
      });

      await Promise.all(upsertPromises);
    }

    console.log('Database updated successfully');
  } catch (error) {
    console.error('Failed to update database:', error);
  }
};

// 재시도 로직 추가
// const retryCreateMany = async (batch: Omit<Culture, 'id'>[], retries: number): Promise<void> => {
//   try {
//     await prisma.culture.createMany({ data: batch });
//   } catch (error) {
//     if (retries > 0) {
//       console.log(`Retrying... attempts left: ${retries}`);
//       await retryCreateMany(batch, retries - 1);
//     } else {
//       console.error('Failed after multiple retries:', error);
//       throw error;
//     }
//   }
// };

export async function POST() {
  try {
    await updateDatabase(); // 데이터베이스 업데이트 호출
    return NextResponse.json({ message: 'Database updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to update database:', error);
    return NextResponse.json({ error: 'Failed to update database' }, { status: 500 });
  }
}
