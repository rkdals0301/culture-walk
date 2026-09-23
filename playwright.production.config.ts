import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PRODUCTION_BASE_URL || 'https://culturewalk.gangmin.dev';

export default defineConfig({
  testDir: './e2e/production',
  outputDir: 'test-results/production-browser',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: 'github',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'mobile-webkit-production',
      use: {
        ...devices['iPhone 13'],
        browserName: 'webkit',
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
