import { defineConfig, devices } from '@playwright/test';

const executandoHeaded = process.argv.includes('--headed');

export default defineConfig({
  testDir: './e2e',
  timeout: executandoHeaded ? 60 * 1000 : 30 * 1000,
  fullyParallel: !executandoHeaded,
  workers: executandoHeaded ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 120 * 1000
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 }
      }
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 7']
      }
    }
  ]
});
