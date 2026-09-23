import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:4321',
    trace: 'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
      args: ['--no-sandbox','--disable-dev-shm-usage','--no-zygote'],
    } : {},
  },
  webServer: process.env.BASE_URL ? undefined : {
    command: 'npm run dev', url: 'http://127.0.0.1:4321', reuseExistingServer: !process.env.CI,
  },
});
