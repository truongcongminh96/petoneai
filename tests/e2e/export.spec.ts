import { expect, test } from "@playwright/test";

test("exports products to xlsx", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Sản phẩm/i }).click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Xuất Excel/i }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/petoneai_san_pham_.*\.xlsx$/);
});
