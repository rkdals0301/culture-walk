import localFont from 'next/font/local';

// 폰트 설정 함수
const Pretendard = localFont({
  src: './PretendardVariable.woff2',
  display: 'swap',
  weight: '100 900',
  preload: true, // 폰트를 미리 로드해 초기 로딩 성능 향상
  fallback: ['arial', 'sans-serif'],
});

export default Pretendard;
