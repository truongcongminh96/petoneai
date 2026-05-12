import { expect, test } from "@playwright/test";

test("initial load and inventory navigation stay within MVP budget", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Tổng quan/i })).toBeVisible();
  const initialLoadMs = await page.evaluate(() => {
    const [navigation] = performance.getEntriesByType(
      "navigation",
    ) as PerformanceNavigationTiming[];
    return navigation
      ? navigation.domContentLoadedEventEnd - navigation.startTime
      : performance.now();
  });

  const navigationStartedAt = Date.now();
  await page.getByRole("button", { name: /Sản phẩm/i }).click();
  await expect(
    page.getByRole("table").getByText("Royal Canin Mini Adult"),
  ).toBeVisible();
  await page.getByRole("button", { name: /Nhập hàng/i }).click();
  await expect(page.getByText("Tạo phiếu nhập kho")).toBeVisible();
  await page.getByRole("button", { name: /Báo cáo/i }).click();
  await expect(page.getByText("Giá trị tồn")).toBeVisible();
  const navigationMs = Date.now() - navigationStartedAt;

  expect(initialLoadMs).toBeLessThan(20_000);
  expect(navigationMs).toBeLessThan(2_000);
  expect(consoleErrors).toEqual([]);
});
