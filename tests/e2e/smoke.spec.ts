import { expect, test } from "@playwright/test";

test("app loads with offline mock database", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");

  await expect(page.getByRole("button", { name: /Sản phẩm/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Tổng quan/i })).toBeVisible();
  expect(errors).toEqual([]);
});
