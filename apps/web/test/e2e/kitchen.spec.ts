import { test, expect } from "./fixtures/auth";

test.describe("Kitchen Management", () => {
  test("user sees their kitchen", async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await expect(page.getByText("E2E Test Kitchen")).toBeVisible();
  });

  test("user can access station", async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.getByText("E2E Test Kitchen").click();
    await expect(page.getByText("Garde Manger")).toBeVisible();
  });
});
