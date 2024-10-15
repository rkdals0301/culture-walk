import localFont from 'next/font/local';

// 폰트 설정 함수
const pretendard = localFont({
  src: [
    { path: './pretendard-Regular.woff2', weight: '400', style: 'normal' },
    { path: './Pretendard-Medium.woff2', weight: '400', style: 'normal' },
    { path: './Pretendard-SemiBold.woff2', weight: '400', style: 'normal' },
    { path: './Pretendard-Bold.woff2', weight: '400', style: 'normal' },
  ],
  display: 'swap',
  preload: true,
  fallback: ['arial', 'sans-serif'],
});

export default pretendard;
