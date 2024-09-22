import localFont from 'next/font/local';

// 폰트 설정 함수
const Pretendard = localFont({
  src: [
    {
      path: 'Pretendard-Regular.woff2',
      weight: '400',
      style: 'normal',
    },

    {
      path: 'Pretendard-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap', // 폰트 로딩 중에도 텍스트가 표시되도록 함
  preload: true, // 폰트를 미리 로드해 초기 로딩 성능 향상
});

export default Pretendard;
