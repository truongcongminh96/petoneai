import { expect, test } from "@playwright/test";

const pages = [
  { nav: "Sản phẩm", heading: "Kho hàng" },
  { nav: "Nhập hàng", text: "Tạo phiếu nhập kho" },
  { nav: "Lịch sử kho", text: "Điều chỉnh tồn kho" },
  { nav: "Báo cáo", text: "Giá trị tồn" },
  { nav: "Cài đặt", text: "Backup / Restore dữ liệu local" },
];

test("core inventory navigation is reachable", async ({ page }) => {
  await page.goto("/");

  for (const item of pages) {
    await page.getByRole("button", { name: new RegExp(item.nav, "i") }).click();
    if ("heading" in item) {
      await expect(page.getByRole("heading", { name: item.heading })).toBeVisible();
    } else {
      await expect(page.getByText(item.text, { exact: false })).toBeVisible();
    }
  }
});
