import { setCulture, setCultures } from '@/slices/culturesSlice';
import { Culture } from '@/types/culture';
import axiosInstance from '@/utils/axiosInstance';
import { formatCultureData } from '@/utils/cultureUtils';

import { useDispatch } from 'react-redux';

import { useQuery } from '@tanstack/react-query';

// 전체 Culture 목록을 가져오는 훅
export const useCultures = (enabled: boolean = true) => {
  const dispatch = useDispatch();

  return useQuery<Culture[], Error>({
    queryKey: ['cultures'], // 필수: 쿼리 키
    queryFn: async () => {
      const response = await axiosInstance.get('/api/cultures');
      const formattedCultures = formatCultureData(response.data); // 데이터 형식화
      dispatch(setCultures(formattedCultures)); // Redux에 저장
      return formattedCultures;
    },
    enabled,
  });
};

// 특정 Culture ID를 통해 상세 데이터를 가져오는 훅
export const useCultureById = (id: number) => {
  const dispatch = useDispatch();

  return useQuery<Culture, Error>({
    queryKey: ['culture', id], // 필수: 쿼리 키
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/cultures/${id}`);
      const formattedCulture = formatCultureData([response.data])[0]; // 데이터 형식화
      dispatch(setCulture(formattedCulture)); // Redux에 저장
      return formattedCulture;
    },
    enabled: !!id, // id가 유효할 때만 쿼리 실행
  });
};
