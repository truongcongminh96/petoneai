import { getDb } from "@/db";

export interface InventoryProduct {
  id: number;
  name: string;
  sku: string;
  stock_quantity: number;
  cost_price: number;
  selling_price: number;
  unit: string | null;
}

export interface SupplierRow {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  note: string | null;
  created_at: string | null;
}

export interface ReceiveItemInput {
  productId: number;
  quantity: number;
  unitCost: number;
}

export interface ReceiveStockInput {
  supplierId: number | null;
  supplierName: string;
  invoiceNo: string;
  purchaseDate: string;
  note: string;
  items: ReceiveItemInput[];
}

export interface StockMovementRow {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  type: string;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  unit_cost: number | null;
  reference_type: string | null;
  reference_id: number | null;
  note: string | null;
  created_at: string | null;
}

export async function loadInventoryProducts() {
  const database = await getDb();
  return database.select<InventoryProduct[]>(
    `SELECT id, name, sku, stock_quantity, cost_price, selling_price, unit
     FROM products
     ORDER BY name ASC`,
  );
}

export async function loadSuppliers() {
  const database = await getDb();
  return database.select<SupplierRow[]>(
    `SELECT * FROM suppliers ORDER BY name ASC`,
  );
}

async function getOrCreateSupplierId(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const database = await getDb();
  await database.execute(
    "INSERT OR IGNORE INTO suppliers (name) VALUES (?)",
    [trimmed],
  );
  const rows = await database.select<{ id: number }[]>(
    "SELECT id FROM suppliers WHERE name = ?",
    [trimmed],
  );
  return rows[0]?.id ?? null;
}

export async function receiveStock(input: ReceiveStockInput) {
  const validItems = input.items.filter(
    (item) => item.productId > 0 && item.quantity > 0 && item.unitCost >= 0,
  );
  if (validItems.length === 0) {
    throw new Error("Cần ít nhất một dòng hàng hợp lệ.");
  }

  const database = await getDb();
  await database.execute("BEGIN");
  try {
    const supplierId =
      input.supplierId ?? (await getOrCreateSupplierId(input.supplierName));
    const totalAmount = validItems.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0,
    );

    await database.execute(
      `INSERT INTO purchase_orders
       (supplier_id, invoice_no, purchase_date, total_amount, note)
       VALUES (?, ?, ?, ?, ?)`,
      [
        supplierId,
        input.invoiceNo.trim() || null,
        input.purchaseDate,
        totalAmount,
        input.note.trim() || null,
      ],
    );
    const purchaseOrderId = (
      await database.select<{ id: number }[]>(
        "SELECT last_insert_rowid() as id",
      )
    )[0].id;

    for (const item of validItems) {
      const product = (
        await database.select<
          { stock_quantity: number; name: string; sku: string }[]
        >("SELECT stock_quantity, name, sku FROM products WHERE id = ?", [
          item.productId,
        ])
      )[0];
      if (!product) throw new Error("Không tìm thấy sản phẩm nhập kho.");

      const before = product.stock_quantity;
      const after = before + item.quantity;
      const subtotal = item.quantity * item.unitCost;

      await database.execute(
        `INSERT INTO purchase_order_items
         (purchase_order_id, product_id, quantity, unit_cost, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [purchaseOrderId, item.productId, item.quantity, item.unitCost, subtotal],
      );
      await database.execute(
        `UPDATE products
         SET stock_quantity = ?, cost_price = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [after, item.unitCost, item.productId],
      );
      await database.execute(
        `INSERT INTO stock_movements
         (product_id, type, quantity_change, quantity_before, quantity_after,
          unit_cost, reference_type, reference_id, note)
         VALUES (?, 'purchase', ?, ?, ?, ?, 'purchase_order', ?, ?)`,
        [
          item.productId,
          item.quantity,
          before,
          after,
          item.unitCost,
          purchaseOrderId,
          input.invoiceNo.trim() || "Nhập hàng",
        ],
      );
    }

    await database.execute("COMMIT");
    return purchaseOrderId;
  } catch (error) {
    await database.execute("ROLLBACK");
    throw error;
  }
}

export async function adjustStock(
  productId: number,
  targetQuantity: number,
  note: string,
) {
  const database = await getDb();
  await database.execute("BEGIN");
  try {
    const product = (
      await database.select<{ stock_quantity: number }[]>(
        "SELECT stock_quantity FROM products WHERE id = ?",
        [productId],
      )
    )[0];
    if (!product) throw new Error("Không tìm thấy sản phẩm.");

    const before = product.stock_quantity;
    const after = Math.max(0, targetQuantity);
    const change = after - before;
    if (change === 0) {
      await database.execute("COMMIT");
      return;
    }

    await database.execute(
      "UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [after, productId],
    );
    await database.execute(
      `INSERT INTO stock_movements
       (product_id, type, quantity_change, quantity_before, quantity_after,
        reference_type, note)
       VALUES (?, 'adjustment', ?, ?, ?, 'stock_adjustment', ?)`,
      [productId, change, before, after, note.trim() || "Điều chỉnh kho"],
    );
    await database.execute("COMMIT");
  } catch (error) {
    await database.execute("ROLLBACK");
    throw error;
  }
}

export async function loadStockMovements(limit = 200) {
  const database = await getDb();
  return database.select<StockMovementRow[]>(
    `SELECT
       stock_movements.*,
       products.name as product_name,
       products.sku as sku
     FROM stock_movements
     JOIN products ON products.id = stock_movements.product_id
     ORDER BY stock_movements.created_at DESC, stock_movements.id DESC
     LIMIT ?`,
    [limit],
  );
}

export async function loadPurchaseOrders() {
  const database = await getDb();
  return database.select<
    {
      id: number;
      supplier_name: string | null;
      invoice_no: string | null;
      purchase_date: string;
      total_amount: number;
      note: string | null;
      created_at: string | null;
    }[]
  >(
    `SELECT purchase_orders.*, suppliers.name as supplier_name
     FROM purchase_orders
     LEFT JOIN suppliers ON suppliers.id = purchase_orders.supplier_id
     ORDER BY purchase_orders.purchase_date DESC, purchase_orders.id DESC
     LIMIT 100`,
  );
}
