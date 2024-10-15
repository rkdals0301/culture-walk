import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class', // or 'media' or 'class'
  content: ['./src/app/**/*.{js,ts,jsx,tsx,mdx}', './src/components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
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
