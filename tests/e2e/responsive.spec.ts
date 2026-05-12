import { expect, test } from "@playwright/test";

test("mobile layout keeps inventory actions reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByRole("button", { name: /Sản phẩm/i }).click();

  await expect(page.getByText("Import Excel")).toBeVisible();
  await expect(page.getByRole("button", { name: /Thêm/i })).toBeVisible();
});
