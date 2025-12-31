import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/kniferoll/i);
  });

  test("login page accessible", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('[data-testid="page-login"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("signup page accessible", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator('[data-testid="page-signup"]')).toBeVisible();
    await expect(
      page.getByRole("button", { name: /create account/i })
    ).toBeVisible();
  });
});
