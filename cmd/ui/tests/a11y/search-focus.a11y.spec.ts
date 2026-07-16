import { expect, expectNoAccessibilityViolations, test } from '../fixtures';

test.describe('Explore page accessibility', () => {
    test('focuses the node search field on navigation', async ({ page }) => {
        await page.goto('/ui/explore');

        await expect(page.getByLabel('Search Nodes')).toBeFocused();
    });

   
});