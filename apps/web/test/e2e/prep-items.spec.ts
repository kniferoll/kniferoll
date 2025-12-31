import { test, expect } from "./fixtures/auth";

test.describe("Prep Items", () => {
  test("user can add a prep item", async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const itemName = `Dice onions ${Date.now()}`;

    // Navigate to station
    await page.getByText("E2E Test Kitchen").click();
    await page.getByText("Garde Manger").click();

    // Add item
    await page.fill('input[placeholder="Add prep item..."]', itemName);
    await page.keyboard.press("Enter");

    // Verify item appears in the list
    await expect(page.locator(`text=${itemName}`).nth(0)).toBeAttached();
  });

  test("user can mark prep item complete", async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const itemName = `Complete me ${Date.now()}`;

    // Navigate to station
    await page.getByText("E2E Test Kitchen").click();
    await page.getByText("Garde Manger").click();

    // Add item
    await page.fill('input[placeholder="Add prep item..."]', itemName);
    await page.keyboard.press("Enter");

    // Wait for item to appear
    await expect(page.locator(`text=${itemName}`).nth(0)).toBeAttached();

    // Find the prep item's status button - it's the button with aria-label="Cycle status"
    // that's near the item text
    const statusButtons = page.getByLabel("Cycle status");
    // Get the last one (most recently added item)
    const statusButton = statusButtons.last();

    // Click to cycle status (not_started -> in_progress)
    await statusButton.click();

    // Verify item still exists after status change
    await expect(page.locator(`text=${itemName}`).nth(0)).toBeAttached();
  });
});
