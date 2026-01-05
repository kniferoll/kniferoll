import { test, expect } from "./fixtures/auth";

test.describe("Authentication", () => {
  test("user can log in", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[id="email"]', "e2e-test@kniferoll.app");
    await page.fill('input[id="password"]', "TestPassword123!");
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL(/dashboard/);
  });

  test("user can log out", async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    // Click the avatar button (inside the data-avatar-menu container)
    // Use .first() since there are desktop and mobile versions in the DOM
    await page.locator("[data-avatar-menu] button").first().click();
    await page.click('text="Sign Out"');
    await expect(page).toHaveURL(/login/);
  });
});
