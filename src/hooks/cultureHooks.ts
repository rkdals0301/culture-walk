import { Culture } from '@/types/culture';
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { setCultures, setCulture } from '@/slices/culturesSlice';
import { formatCultureData } from '@/utils/cultureUtils';
import { toast } from 'react-toastify';

export const useCultures = (enabled: boolean = true) => {
  const dispatch = useDispatch();

  return useQuery<Culture[], Error>({
    queryKey: ['cultures'], // 필수: 쿼리 키
    queryFn: async () => {
      const response = await fetch('/api/cultures');
      if (!response.ok) {
        const errorMessage = await response.text();
        toast.error(`오류: ${errorMessage}`); // 훅에서 직접 에러 표시
        throw new Error(`Error ${response.status}: ${errorMessage}`);
      }
      const data = await response.json(); // 비동기 처리
      const formattedCultures = formatCultureData(data); // 데이터 형식화
      dispatch(setCultures(formattedCultures)); // Redux에 저장
      return formattedCultures;
    },
    enabled,
  });
};

export const useCultureById = (id: number) => {
  const dispatch = useDispatch();

  return useQuery<Culture, Error>({
    queryKey: ['culture', id], // 필수: 쿼리 키
    queryFn: async () => {
      const response = await fetch(`/api/cultures/${id}`);
      if (!response.ok) {
        const errorMessage = await response.text();
        toast.error(`오류: ${errorMessage}`); // 훅에서 직접 에러 표시
        throw new Error(`오류: ${response.status}: ${errorMessage}`);
      }

      const data = await response.json(); // 비동기 처리
      const formattedCulture = formatCultureData([data])[0]; // 데이터 형식화
      dispatch(setCulture(formattedCulture)); // Redux에 저장
      return formattedCulture;
    },
    enabled: !!id, // id가 유효할 때만 쿼리 실행
  });
};
