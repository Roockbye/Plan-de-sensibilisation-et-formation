import { defineConfig, devices } from '@playwright/test';

// Tests de bout en bout sur le site construit (npm run build), servi avec ses en-têtes de sécurité.
// En local, CHROMIUM_PATH permet d'utiliser le Chromium du système (ex. /usr/bin/chromium).
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4322',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
      },
    },
  ],
  webServer: {
    command: 'node scripts/serveur.ts 4322',
    url: 'http://127.0.0.1:4322/',
    reuseExistingServer: !process.env.CI,
  },
});
