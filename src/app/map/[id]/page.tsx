'use client';

// import { useEffect } from 'react';
import BottomSheet from '@/components/Map/BottomSheet';
// import { useRouter } from 'next/navigation';

const MapDetail = ({ params }: { params: { id: string } }) => {
  console.log(params.id);
  // const router = useRouter();

  // const closeBottomSheet = () => {
  //   router.push('/map'); // 바텀 시트 닫기 시, URL만 변경하고 상태는 유지
  // };

  return (
    <>
      <BottomSheet />
    </>
  );
};

export default MapDetail;
