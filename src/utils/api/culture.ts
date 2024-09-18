// import { Culture } from '@/types/culture';

// const BASE_URL = '/api/684e537944726b643635534d756b47/json/culturalEventInfo';
// const INITIAL_START_INDEX = 1;
// const PAGE_SIZE = 1000;

// export const fetchCultures = async (): Promise<RawCulture[]> => {
//   const allCultures: RawCulture[] = [];
//   let startIndex = INITIAL_START_INDEX;
//   let endIndex = PAGE_SIZE;
//   let totalDataCount = 0;

//   try {
//     const firstResponse = await fetch(`${BASE_URL}/${startIndex}/${endIndex}`);
//     if (!firstResponse.ok) {
//       throw new Error('Failed to fetch initial cultures data');
//     }

//     const firstData = await firstResponse.json();
//     totalDataCount = firstData?.culturalEventInfo?.list_total_count || 0;
//     const firstCultures = firstData?.culturalEventInfo?.row || [];
//     allCultures.push(...firstCultures);
//     startIndex += PAGE_SIZE;
//     endIndex += PAGE_SIZE;

//     const requests = [];
//     while (startIndex <= totalDataCount) {
//       requests.push(
//         fetch(`${BASE_URL}/${startIndex}/${endIndex}`).then(response => {
//           if (!response.ok) {
//             throw new Error('Failed to fetch cultures data');
//           }
//           return response.json();
//         })
//       );
//       startIndex += PAGE_SIZE;
//       endIndex += PAGE_SIZE;
//     }

//     const responses = await Promise.all(requests);
//     for (const data of responses) {
//       const cultures = data?.culturalEventInfo?.row || [];
//       allCultures.push(...cultures);
//     }
//   } catch (error) {
//     console.error('Error fetching cultures:', error);
//   }

//   return allCultures;
// };

export const fetchCultures = async () => {
  try {
    const response = await fetch('/api/cultures');
    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Failed to fetch cultures: ${response.statusText} - ${errorMessage}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching cultures:', error);
    throw error;
  }
};

// utils/api.ts
export const fetchCultureById = async (id: number) => {
  try {
    const response = await fetch(`/api/cultures/${id}`);
    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Failed to fetch cultures: ${response.statusText} - ${errorMessage}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching culture:', error);
    throw error;
  }
};
