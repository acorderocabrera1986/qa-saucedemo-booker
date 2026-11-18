import dns from 'dns';
import { defineConfig, devices } from '@playwright/test';

dns.setDefaultResultOrder('ipv4first');

const sauceDemo = 'https://www.saucedemo.com';
const booker = 'https://restful-booker.herokuapp.com';

// En local, PW_USE_SYSTEM_BROWSERS=1 usa el Chrome instalado.
// Firefox, y Chromium en CI, los descarga Playwright.
const useSystemBrowsers = process.env.PW_USE_SYSTEM_BROWSERS === '1';

export default defineConfig({
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    testIdAttribute: 'data-test',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      testDir: './tests/e2e',
      use: {
        ...devices['Desktop Chrome'],
        ...(useSystemBrowsers ? { channel: 'chrome' as const } : {}),
        baseURL: sauceDemo,
      },
    },
    {
      name: 'firefox',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Firefox'], baseURL: sauceDemo },
    },
    {
      name: 'api',
      testDir: './tests/api',
      timeout: 45_000,
      retries: 2,
      use: {
        baseURL: booker,
        extraHTTPHeaders: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    },
  ],
});
