import { invoke } from "@tauri-apps/api/core";
import * as XLSX from "xlsx";
import { getDb } from "@/db";

interface ExportProductRow {
  sku: string;
  name: string;
  barcode: string | null;
  category_name: string | null;
  brand: string | null;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  unit: string | null;
}

function isTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

function downloadInBrowser(bytes: Uint8Array, fileName: string) {
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportProductsToExcel() {
  const database = await getDb();
  const rows = await database.select<ExportProductRow[]>(
    `SELECT
       products.sku,
       products.name,
       products.barcode,
       product_categories.name as category_name,
       products.brand,
       products.cost_price,
       products.selling_price,
       products.stock_quantity,
       products.low_stock_threshold,
       products.unit
     FROM products
     LEFT JOIN product_categories ON products.category_id = product_categories.id
     ORDER BY products.name ASC`,
  );

  const exportData = rows.map((product) => ({
    SKU: product.sku,
    "Tên sản phẩm": product.name,
    "Mã vạch": product.barcode ?? "",
    "Danh mục": product.category_name ?? "",
    "Thương hiệu": product.brand ?? "",
    "Giá vốn": product.cost_price,
    "Giá bán": product.selling_price,
    "Tồn kho": product.stock_quantity,
    "Cảnh báo tồn thấp": product.low_stock_threshold,
    "Đơn vị": product.unit ?? "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sản phẩm");
  const buffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  }) as ArrayBuffer;
  const bytes = new Uint8Array(buffer);
  const fileName = `petoneai_san_pham_${new Date().toISOString().slice(0, 10)}.xlsx`;

  if (isTauriRuntime()) {
    return invoke<string>("save_excel_file", {
      fileName,
      bytes: Array.from(bytes),
    });
  }

  downloadInBrowser(bytes, fileName);
  return fileName;
}
