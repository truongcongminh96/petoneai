import { getDb } from "@/db";

export interface ProductImportRow {
  rowNumber: number;
  sku: string;
  name: string;
  barcode: string;
  categoryName: string;
  brand: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  unit: string;
  errors: string[];
  mode: "create" | "update";
}

function valueOf(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function numberOf(row: Record<string, unknown>, keys: string[]) {
  const raw = valueOf(row, keys).replace(/[^\d.-]/g, "");
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

export async function normalizeProductImportRows(
  rows: Record<string, unknown>[],
) {
  const database = await getDb();
  const existing = await database.select<{ sku: string }[]>(
    "SELECT sku FROM products",
  );
  const existingSkus = new Set(existing.map((row) => row.sku.toLowerCase()));
  const seen = new Set<string>();

  return rows.map<ProductImportRow>((row, index) => {
    const sku = valueOf(row, ["SKU", "sku", "Mã SKU", "Ma SKU"]);
    const name = valueOf(row, [
      "Tên sản phẩm",
      "Ten san pham",
      "name",
      "Name",
    ]);
    const normalizedSku = sku.toLowerCase();
    const duplicateInFile = normalizedSku ? seen.has(normalizedSku) : false;
    if (normalizedSku) seen.add(normalizedSku);

    const errors: string[] = [];
    if (!sku) errors.push("Thiếu SKU");
    if (!name) errors.push("Thiếu tên sản phẩm");
    if (duplicateInFile) errors.push("SKU bị trùng trong file");

    return {
      rowNumber: index + 2,
      sku,
      name,
      barcode: valueOf(row, ["Mã vạch", "Ma vach", "barcode", "Barcode"]),
      categoryName: valueOf(row, ["Danh mục", "Danh muc", "category"]),
      brand: valueOf(row, ["Thương hiệu", "Thuong hieu", "brand"]),
      costPrice: numberOf(row, ["Giá vốn", "Gia von", "cost_price"]),
      sellingPrice: numberOf(row, ["Giá bán", "Gia ban", "selling_price"]),
      stockQuantity: Math.max(
        0,
        Math.trunc(numberOf(row, ["Tồn kho", "Ton kho", "stock_quantity"])),
      ),
      unit: valueOf(row, ["Đơn vị", "Don vi", "unit"]) || "cái",
      errors,
      mode: existingSkus.has(normalizedSku) ? "update" : "create",
    };
  });
}

async function getOrCreateCategoryId(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const database = await getDb();
  await database.execute(
    "INSERT OR IGNORE INTO product_categories (name) VALUES (?)",
    [trimmed],
  );
  const rows = await database.select<{ id: number }[]>(
    "SELECT id FROM product_categories WHERE name = ?",
    [trimmed],
  );
  return rows[0]?.id ?? null;
}

export async function commitProductImport(rows: ProductImportRow[]) {
  const validRows = rows.filter((row) => row.errors.length === 0);
  if (validRows.length === 0) throw new Error("Không có dòng hợp lệ để import.");

  const database = await getDb();
  await database.execute("BEGIN");
  try {
    for (const row of validRows) {
      const categoryId = await getOrCreateCategoryId(row.categoryName);
      const existing = (
        await database.select<{ id: number; stock_quantity: number }[]>(
          "SELECT id, stock_quantity FROM products WHERE sku = ?",
          [row.sku],
        )
      )[0];

      if (existing) {
        const before = existing.stock_quantity;
        await database.execute(
          `UPDATE products
           SET name = ?, barcode = ?, category_id = ?, brand = ?,
               cost_price = ?, selling_price = ?, stock_quantity = ?,
               unit = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            row.name,
            row.barcode || null,
            categoryId,
            row.brand || null,
            row.costPrice,
            row.sellingPrice,
            row.stockQuantity,
            row.unit,
            existing.id,
          ],
        );
        const change = row.stockQuantity - before;
        if (change !== 0) {
          await database.execute(
            `INSERT INTO stock_movements
             (product_id, type, quantity_change, quantity_before, quantity_after,
              unit_cost, reference_type, note)
             VALUES (?, 'import', ?, ?, ?, ?, 'excel_import', ?)`,
            [
              existing.id,
              change,
              before,
              row.stockQuantity,
              row.costPrice,
              `Import Excel dòng ${row.rowNumber}`,
            ],
          );
        }
      } else {
        await database.execute(
          `INSERT INTO products
           (name, sku, barcode, category_id, brand, cost_price, selling_price,
            stock_quantity, unit, allow_direct_sale, track_batch)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true, false)`,
          [
            row.name,
            row.sku,
            row.barcode || null,
            categoryId,
            row.brand || null,
            row.costPrice,
            row.sellingPrice,
            row.stockQuantity,
            row.unit,
          ],
        );
        const productId = (
          await database.select<{ id: number }[]>(
            "SELECT last_insert_rowid() as id",
          )
        )[0].id;
        if (row.stockQuantity > 0) {
          await database.execute(
            `INSERT INTO stock_movements
             (product_id, type, quantity_change, quantity_before, quantity_after,
              unit_cost, reference_type, note)
             VALUES (?, 'import', ?, 0, ?, ?, 'excel_import', ?)`,
            [
              productId,
              row.stockQuantity,
              row.stockQuantity,
              row.costPrice,
              `Import Excel dòng ${row.rowNumber}`,
            ],
          );
        }
      }
    }

    await database.execute("COMMIT");
    return validRows.length;
  } catch (error) {
    await database.execute("ROLLBACK");
    throw error;
  }
}
