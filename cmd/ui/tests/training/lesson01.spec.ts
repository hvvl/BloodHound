import { expect, test } from '@playwright/test';

test.describe('Playwright Training', () => {
    test('unauthenticated user is redirected to login', async ({ page }) => {
        await page.goto('/ui/explore');

        await expect(page).toHaveURL(/\/ui\/login/);

        await expect(
            page.getByRole('textbox', {
                name: 'Email Address',
            })
        ).toBeVisible();
    });
});