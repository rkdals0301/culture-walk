import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class', // or 'media' or 'class'
  content: ['./src/app/**/*.{js,ts,jsx,tsx,mdx}', './src/components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        pretendard: [
          '"Pretendard Variable"',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          '"Helvetica Neue"',
          '"Segoe UI"',
          '"Apple SD Gothic Neo"',
          '"Noto Sans KR"',
          '"Malgun Gothic"',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          'sans-serif',
        ],
      },
      width: {
        192: '48rem', // 768px
      },
      height: {
        160: '40rem', // 640px
        175: '43.75rem', // 700px
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
