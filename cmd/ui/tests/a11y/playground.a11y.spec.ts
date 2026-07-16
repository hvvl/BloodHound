import { test } from '@playwright/test';

test('explore Playwright', async ({ page }) => {
    console.log('Test started');

    await page.goto('https://example.com');

    console.log('Reached pause');
    await page.pause();
});