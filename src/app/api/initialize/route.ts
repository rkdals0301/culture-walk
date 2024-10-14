import prisma from '@/lib/prisma';
import { mapRawCultureToCulture } from '@/services/cultureService';
import { Culture, RawCulture } from '@/types/culture';
import axiosInstance from '@/utils/axiosInstance';

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.SEOUL_API_CULTURAL_URL;
const INITIAL_START_INDEX = 1;
const PAGE_SIZE = 1000;
const BATCH_SIZE = 100; // 배치 크기
const CONCURRENT_BATCHES = 2; // 동시 처리 배치 수
const RETRY_LIMIT = 5; // 재시도 횟수

export const revalidate = 0;

const fetchCultures = async () => {
  const allCultures: RawCulture[] = [];
  let startIndex = INITIAL_START_INDEX;
  let endIndex = PAGE_SIZE;
  let totalDataCount = 0;

  try {
    const firstResponse = await axiosInstance.get(`${BASE_URL}/${startIndex}/${endIndex}`);
    totalDataCount = firstResponse.data?.culturalEventInfo?.list_total_count || 0;
    const firstCultures = firstResponse.data?.culturalEventInfo?.row || [];
    allCultures.push(...firstCultures);
    startIndex += PAGE_SIZE;
    endIndex += PAGE_SIZE;

    const requests = [];
    while (startIndex <= totalDataCount) {
      requests.push(axiosInstance.get(`${BASE_URL}/${startIndex}/${endIndex}`));
      startIndex += PAGE_SIZE;
      endIndex += PAGE_SIZE;
    }

    const responses = await Promise.allSettled(requests);

    for (const result of responses) {
      if (result.status === 'fulfilled') {
        const cultures = result.value?.data?.culturalEventInfo?.row || [];
        allCultures.push(...cultures);
      } else {
        console.error('요청 실패:', result.reason);
      }
    }
  } catch (error) {
    console.error('문화 데이터를 가져오는 중 오류 발생:', error);
  }
  return allCultures;
};

const updateDatabase = async () => {
  try {
    console.time('문화 데이터 가져오기');
    const externalData: RawCulture[] = await fetchCultures();
    console.timeEnd('문화 데이터 가져오기');

    console.time('모든 문화 데이터 삭제');
    await deleteAllCultures();
    console.timeEnd('모든 문화 데이터 삭제');

    console.time('모든 문화 데이터 삭제 및 저장');
    await processBatches(externalData);
    console.timeEnd('모든 문화 데이터 삭제 및 저장');
  } catch (error) {
    console.error('데이터베이스 업데이트 실패:', error);
  }
};

// 모든 문화 데이터 삭제 함수
const deleteAllCultures = async () => {
  await prisma.culture.deleteMany({});
};

// 데이터를 배치로 나누어 저장하고 처리하는 함수
const processBatches = async (data: RawCulture[]) => {
  const batchedData = createBatches(data);
  const batchPromises = createBatchPromises(batchedData);
  const results = await Promise.allSettled(batchPromises);
  const totalBatches = results.length;
  const successfulBatches = results.filter(result => result.status === 'fulfilled').length;
  const failedBatches = results.filter(result => result.status === 'rejected').length;

  // 각 Promise의 결과 처리
  console.log(`총 배치 수: ${totalBatches}`);
  console.log(`성공한 배치 수: ${successfulBatches}`);
  console.log(`실패한 배치 수: ${failedBatches}`);

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`배치 ${index + 1} 처리 실패: ${result.reason}`);
    }
  });

  // 실패한 배치가 없을 경우 메시지 출력
  if (!results.some(result => result.status === 'rejected')) {
    console.log('모든 배치 처리가 성공했습니다.');
  }
};

// 주어진 데이터를 배치로 나누는 함수
const createBatches = (data: RawCulture[]): Omit<Culture, 'id'>[][] => {
  const batches: Omit<Culture, 'id'>[][] = [];
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE).map(mapRawCultureToCulture);
    batches.push(batch);
  }
  return batches;
};

// 배치 처리에 대한 Promise 배열 생성 함수
const createBatchPromises = (batches: Omit<Culture, 'id'>[][]) => {
  const promises = [];
  while (batches.length > 0) {
    const currentBatches = batches.splice(0, CONCURRENT_BATCHES);
    promises.push(...currentBatches.map(batch => retryCreateMany(batch, RETRY_LIMIT)));
  }
  return promises;
};

// 재시도 로직 추가
const retryCreateMany = async (batch: Omit<Culture, 'id'>[], retries: number): Promise<void> => {
  try {
    await prisma.culture.createMany({ data: batch });
  } catch (error) {
    if (retries > 0) {
      console.log(`재시도 중... 남은 시도 횟수: ${retries}`);
      await retryCreateMany(batch, retries - 1);
    } else {
      console.error('다수의 재시도 후 실패:', error);
      throw error;
    }
  }
};

export async function POST() {
  try {
    console.time('데이터베이스 업데이트');
    await updateDatabase(); // 데이터베이스 업데이트 호출
    console.timeEnd('데이터베이스 업데이트');
    return NextResponse.json({ message: '데이터베이스 업데이트 성공' }, { status: 200 });
  } catch (error) {
    console.error('데이터베이스 업데이트 실패:', error);
    return NextResponse.json({ error: '데이터베이스 업데이트 실패' }, { status: 500 });
  }
}
