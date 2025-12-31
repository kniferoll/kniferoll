/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, Page } from "@playwright/test";

const TEST_USER = {
  email: "e2e-test@kniferoll.app",
  password: "TestPassword123!",
};

export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto("/login");
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL("**/dashboard");
    await use(page);
  },
});

export { expect } from "@playwright/test";
