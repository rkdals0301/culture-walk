import { defineConfig, devices } from '@playwright/test';

const PORT = 3005;
const baseURL = `http://127.0.0.1:${PORT}`;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  outputDir: 'test-results/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? 'github' : 'list',
  timeout: 20_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL,
    actionTimeout: 6_000,
    navigationTimeout: 12_000,
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
      name: 'mobile-chromium',
      use: {
        ...devices['iPhone 13'],
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: {
    command: `npx wrangler dev --local --persist-to .wrangler/e2e --ip 127.0.0.1 --port ${PORT} --show-interactive-dev-session=false --log-level=warn`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
