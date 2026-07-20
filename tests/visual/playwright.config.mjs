import { defineConfig, devices } from '@playwright/test';

const storageState = process.env.PLAYWRIGHT_STORAGE_STATE || undefined;

export default defineConfig({
  testDir: '.',
  testMatch: ['**/*.spec.mjs'],
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  outputDir: 'results/artifacts',
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
    browserName: 'chromium',
    colorScheme: 'light',
    deviceScaleFactor: 1,
    locale: 'tr-TR',
    reducedMotion: 'reduce',
    storageState,
    timezoneId: 'Europe/Istanbul',
    trace: 'retain-on-failure',
    viewport: { width: 1904, height: 861 },
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
