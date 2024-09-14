import localFont from 'next/font/local';

// 폰트 설정 함수
const notoSansKr = localFont({
  src: [
    // {
    //   path: 'noto-sans-kr-v36-korean_latin-100.2016656d.woff2',
    //   weight: '100',
    //   style: 'normal',
    // },
    // {
    //   path: 'noto-sans-kr-v36-korean_latin-100.260c8d00.ttf',
    //   weight: '100',
    //   style: 'normal',
    // },
    // {
    //   path: 'noto-sans-kr-v36-korean_latin-200.4a1f3f55.woff2',
    //   weight: '200',
    //   style: 'normal',
    // },
    // {
    //   path: 'noto-sans-kr-v36-korean_latin-200.5b8cdea1.ttf',
    //   weight: '200',
    //   style: 'normal',
    // },
    // {
    //   path: 'noto-sans-kr-v36-korean_latin-300.c2e4fce5.woff2',
    //   weight: '300',
    //   style: 'normal',
    // },
    // {
    //   path: 'noto-sans-kr-v36-korean_latin-300.8b13e06d.ttf',
    //   weight: '300',
    //   style: 'normal',
    // },
    {
      path: 'noto-sans-kr-v36-korean_latin-regular.8fe63ee1.woff2',
      weight: '400',
      style: 'normal',
    },
    // {
    //   path: 'noto-sans-kr-v36-korean_latin-regular.58173748.ttf',
    //   weight: '400',
    //   style: 'normal',
    // },
    // {
    //   path: 'noto-sans-kr-v36-korean_latin-500.277b3c41.woff2',
    //   weight: '500',
    //   style: 'normal',
    // },
    // {
    //   path: 'noto-sans-kr-v36-korean_latin-500.f7bc195e.ttf',
    //   weight: '500',
    //   style: 'normal',
    // },
    // {
    //   path: 'noto-sans-kr-v36-korean_latin-600.c569abd4.woff2',
    //   weight: '600',
    //   style: 'normal',
    // },
    // {
    //   path: 'noto-sans-kr-v36-korean_latin-600.b4ab4a01.ttf',
    //   weight: '600',
    //   style: 'normal',
    // },
    {
      path: 'noto-sans-kr-v36-korean_latin-700.1d3dfebc.woff2',
      weight: '700',
      style: 'normal',
    },
    // {
    //   path: 'noto-sans-kr-v36-korean_latin-700.9b9566bb.ttf',
    //   weight: '700',
    //   style: 'normal',
    // },
    // {
    //   path: 'noto-sans-kr-v36-korean_latin-800.691d70dc.woff2',
    //   weight: '800',
    //   style: 'normal',
    // },
    // {
    //   path: 'noto-sans-kr-v36-korean_latin-800.f085c73d.ttf',
    //   weight: '800',
    //   style: 'normal',
    // },
    // {
    //   path: 'noto-sans-kr-v36-korean_latin-900.894c2c2f.woff2',
    //   weight: '900',
    //   style: 'normal',
    // },
    // {
    //   path: 'noto-sans-kr-v36-korean_latin-900.de441d13.ttf',
    //   weight: '900',
    //   style: 'normal',
    // },
  ],
  display: 'swap', // 폰트 로딩 중에도 텍스트가 표시되도록 함
  preload: true, // 폰트를 미리 로드해 초기 로딩 성능 향상
});

export default notoSansKr;
