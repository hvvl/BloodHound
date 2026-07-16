import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({
    path: fileURLToPath(new URL('./.env', import.meta.url)),
});

const baseURL = process.env.A11Y_TEST_URL;

if (!baseURL) {
    throw new Error('A11Y_TEST_URL is required in cmd/ui/.env');
}

export default defineConfig({
    testDir: './tests/training',
    testMatch: /.*\.spec\.ts/,

    workers: 1,

    use: {
        baseURL,
        ...devices['Desktop Chrome'],
        headless: false,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },

    reporter: [
        ['list'],
        [
            'html',
            {
                outputFolder: 'playwright/training/html-report',
                open: 'never',
            },
        ],
    ],

    outputDir: 'playwright/training/results',

    webServer:
        process.env.A11Y_TEST_SERVE === 'true'
            ? {
                  command: 'yarn dev --host 127.0.0.1 --port 3000',
                  url: baseURL,
                  reuseExistingServer: true,
              }
            : undefined,
});