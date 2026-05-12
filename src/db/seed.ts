import { getDb } from "./index";

const sampleCategories = [
  "Thức ăn",
  "Phụ kiện",
  "Thuốc & Vitamin",
  "Đồ chơi",
  "Vệ sinh",
  "Dịch vụ",
];

const sampleProducts = [
  ["Royal Canin Mini Adult", "RC-MINI-01", "8935095611456", "Thức ăn", "Royal Canin", 350000, 420000, 25, 5, "bao"],
  ["Pate Whiskas vị cá ngừ", "WK-PATE-01", "8935095622001", "Thức ăn", "Whiskas", 12000, 18000, 120, 10, "gói"],
  ["Dây xích dắt chó 1.5m", "PK-LEASH-01", "8935095633001", "Phụ kiện", "PetPro", 45000, 75000, 30, 5, "cái"],
  ["Vòng cổ mèo có chuông", "PK-COLLAR-01", "8935095633002", "Phụ kiện", "CatLife", 25000, 45000, 50, 5, "cái"],
  ["Thuốc xổ giun Drontal", "MED-DRON-01", "8935095644001", "Thuốc & Vitamin", "Bayer", 35000, 55000, 3, 10, "viên"],
  ["Vitamin E cho chó mèo", "MED-VITE-01", "8935095644002", "Thuốc & Vitamin", "Vetripharm", 85000, 120000, 18, 5, "lọ"],
  ["Bóng cao su gặm chó", "TOY-BALL-01", "8935095655001", "Đồ chơi", "PetFun", 20000, 35000, 40, 5, "cái"],
  ["Cát vệ sinh mèo 5L", "HYG-LITTER-01", "8935095666001", "Vệ sinh", "CatSand", 55000, 85000, 2, 5, "bao"],
  ["Sữa tắm trị nấm chó", "HYG-SHAMP-01", "8935095666002", "Vệ sinh", "Bio-Clean", 65000, 95000, 15, 5, "chai"],
  ["Tắm spa cho mèo", "SVC-SPA-01", "8935095677001", "Dịch vụ", "", 50000, 150000, 999, 5, "lần"],
] as const;

const sampleSuppliers = [
  ["Công ty PetCare Việt Nam", "0901 222 333", "sales@petcare.demo", "12 Nguyễn Văn Cừ, Q5, TP.HCM"],
  ["Nhà phân phối Happy Pet", "0909 888 777", "order@happypet.demo", "88 Cộng Hòa, Tân Bình, TP.HCM"],
  ["Kho sỉ thú y An Khang", "0917 555 666", "", "23 Lê Đức Thọ, Gò Vấp, TP.HCM"],
] as const;

async function scalarCount(table: string) {
  const database = await getDb();
  const rows = await database.select<{ total: number }[]>(
    `SELECT COUNT(*) as total FROM ${table}`,
  );
  return rows[0]?.total ?? 0;
}

async function getIdByName(table: string, name: string) {
  const database = await getDb();
  const rows = await database.select<{ id: number }[]>(
    `SELECT id FROM ${table} WHERE name = ?`,
    [name],
  );
  return rows[0]?.id ?? null;
}

async function getProductBySku(sku: string) {
  const database = await getDb();
  const rows = await database.select<
    {
      id: number;
      stock_quantity: number;
      cost_price: number;
      selling_price: number;
    }[]
  >(
    "SELECT id, stock_quantity, cost_price, selling_price FROM products WHERE sku = ?",
    [sku],
  );
  return rows[0] ?? null;
}

async function ensureCategories() {
  const database = await getDb();
  for (const category of sampleCategories) {
    await database.execute(
      "INSERT OR IGNORE INTO product_categories (name) VALUES (?)",
      [category],
    );
  }
}

async function seedProductRows() {
  if ((await scalarCount("products")) > 0) return;

  const database = await getDb();
  const categories = await database.select<{ id: number; name: string }[]>(
    "SELECT id, name FROM product_categories",
  );
  const categoryMap = new Map(
    categories.map((category) => [category.name, category.id]),
  );

  for (const row of sampleProducts) {
    const [
      name,
      sku,
      barcode,
      categoryName,
      brand,
      costPrice,
      sellingPrice,
      stockQuantity,
      lowStockThreshold,
      unit,
    ] = row;

    await database.execute(
      `INSERT INTO products (
        name,
        sku,
        barcode,
        category_id,
        brand,
        cost_price,
        selling_price,
        stock_quantity,
        low_stock_threshold,
        unit,
        description,
        allow_direct_sale,
        track_batch
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, false)`,
      [
        name,
        sku,
        barcode,
        categoryMap.get(categoryName) ?? null,
        brand || null,
        costPrice,
        sellingPrice,
        stockQuantity,
        lowStockThreshold,
        unit,
        "Dữ liệu mẫu để demo",
      ],
    );
  }
}

async function seedSuppliers() {
  const database = await getDb();
  for (const [name, phone, email, address] of sampleSuppliers) {
    await database.execute(
      `INSERT OR IGNORE INTO suppliers (name, phone, email, address, note)
       VALUES (?, ?, ?, ?, ?)`,
      [name, phone, email || null, address, "Nhà cung cấp demo"],
    );
  }
}

async function createPurchaseOrder(
  supplierName: string,
  invoiceNo: string,
  purchaseDate: string,
  items: { sku: string; quantity: number; unitCost: number }[],
) {
  const database = await getDb();
  const supplierId = await getIdByName("suppliers", supplierName);
  const total = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

  await database.execute(
    `INSERT INTO purchase_orders
     (supplier_id, invoice_no, purchase_date, total_amount, note)
     VALUES (?, ?, ?, ?, ?)`,
    [supplierId, invoiceNo, purchaseDate, total, "Phiếu nhập demo"],
  );
  const purchaseOrderId = (
    await database.select<{ id: number }[]>("SELECT last_insert_rowid() as id")
  )[0].id;

  for (const item of items) {
    const product = await getProductBySku(item.sku);
    if (!product) continue;

    const quantityAfter = product.stock_quantity;
    const quantityBefore = Math.max(0, quantityAfter - item.quantity);
    await database.execute(
      `INSERT INTO purchase_order_items
       (purchase_order_id, product_id, quantity, unit_cost, subtotal)
       VALUES (?, ?, ?, ?, ?)`,
      [
        purchaseOrderId,
        product.id,
        item.quantity,
        item.unitCost,
        item.quantity * item.unitCost,
      ],
    );
    await database.execute(
      `INSERT INTO stock_movements
       (product_id, type, quantity_change, quantity_before, quantity_after,
        unit_cost, reference_type, reference_id, note, created_at)
       VALUES (?, 'purchase', ?, ?, ?, ?, 'purchase_order', ?, ?, ?)`,
      [
        product.id,
        item.quantity,
        quantityBefore,
        quantityAfter,
        item.unitCost,
        purchaseOrderId,
        invoiceNo,
        `${purchaseDate} 09:00:00`,
      ],
    );
  }
}

async function seedPurchases() {
  if ((await scalarCount("purchase_orders")) > 0) return;

  await createPurchaseOrder("Công ty PetCare Việt Nam", "PN-DEMO-001", "2026-05-01", [
    { sku: "RC-MINI-01", quantity: 10, unitCost: 350000 },
    { sku: "WK-PATE-01", quantity: 60, unitCost: 12000 },
    { sku: "PK-LEASH-01", quantity: 12, unitCost: 45000 },
  ]);
  await createPurchaseOrder("Kho sỉ thú y An Khang", "PN-DEMO-002", "2026-05-03", [
    { sku: "MED-DRON-01", quantity: 3, unitCost: 35000 },
    { sku: "MED-VITE-01", quantity: 8, unitCost: 85000 },
    { sku: "HYG-SHAMP-01", quantity: 6, unitCost: 65000 },
  ]);
}

async function seedOpeningMovements() {
  const database = await getDb();
  await database.execute(
    `INSERT INTO stock_movements (
      product_id,
      type,
      quantity_change,
      quantity_before,
      quantity_after,
      unit_cost,
      reference_type,
      note
    )
    SELECT
      id,
      'opening',
      stock_quantity,
      0,
      stock_quantity,
      cost_price,
      'seed',
      'Tồn đầu kỳ demo'
    FROM products
    WHERE stock_quantity > 0
      AND NOT EXISTS (
        SELECT 1 FROM stock_movements
        WHERE stock_movements.product_id = products.id
          AND stock_movements.type = 'opening'
      )`,
  );
}

async function seedSalesAndExpenses() {
  const database = await getDb();
  if ((await scalarCount("sales")) === 0) {
    const sales = [
      {
        createdAt: "2026-05-04 10:30:00",
        items: [
          { sku: "WK-PATE-01", quantity: 6 },
          { sku: "PK-COLLAR-01", quantity: 1 },
        ],
      },
      {
        createdAt: "2026-05-05 16:15:00",
        items: [
          { sku: "RC-MINI-01", quantity: 1 },
          { sku: "TOY-BALL-01", quantity: 2 },
          { sku: "SVC-SPA-01", quantity: 1 },
        ],
      },
    ];

    for (const sale of sales) {
      let total = 0;
      const saleItems = [];
      for (const item of sale.items) {
        const product = await getProductBySku(item.sku);
        if (!product) continue;
        total += item.quantity * product.selling_price;
        saleItems.push({ ...item, product });
      }

      await database.execute(
        "INSERT INTO sales (total_amount, created_at) VALUES (?, ?)",
        [total, sale.createdAt],
      );
      const saleId = (
        await database.select<{ id: number }[]>("SELECT last_insert_rowid() as id")
      )[0].id;

      for (const item of saleItems) {
        await database.execute(
          "INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
          [saleId, item.product.id, item.quantity, item.product.selling_price],
        );
      }
    }
  }

  if ((await scalarCount("expenses")) === 0) {
    await database.execute(
      "INSERT INTO expenses (description, amount, created_at) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)",
      [
        "Tiền thuê mặt bằng tháng 5",
        6000000,
        "2026-05-01 08:00:00",
        "Chi phí giao hàng nội thành",
        350000,
        "2026-05-03 14:00:00",
        "Vật tư vệ sinh shop",
        220000,
        "2026-05-06 09:30:00",
      ],
    );
  }
}

async function seedLocalUsers() {
  if ((await scalarCount("local_users")) > 1) return;

  const database = await getDb();
  await database.execute(
    `INSERT INTO local_users (name, role, pin, active)
     SELECT 'Chủ shop', 'owner', '1234', true
     WHERE NOT EXISTS (SELECT 1 FROM local_users WHERE role = 'owner')`,
  );
  await database.execute(
    `INSERT INTO local_users (name, role, pin, active)
     SELECT 'Quản lý ca', 'manager', '2222', true
     WHERE NOT EXISTS (SELECT 1 FROM local_users WHERE role = 'manager')`,
  );
  await database.execute(
    `INSERT INTO local_users (name, role, pin, active)
     SELECT 'Thu ngân', 'cashier', '1111', true
     WHERE NOT EXISTS (SELECT 1 FROM local_users WHERE role = 'cashier')`,
  );
}

export async function seedProducts() {
  try {
    await ensureCategories();
    await seedProductRows();
    await seedSuppliers();
    await seedOpeningMovements();
    await seedPurchases();
    await seedSalesAndExpenses();
    await seedLocalUsers();
    console.log("Seed data inserted");
  } catch (error) {
    console.error("Seed failed:", error);
    throw error;
  }
}

export async function resetDemoData() {
  const database = await getDb();
  try {
    await database.execute("DELETE FROM stock_movements");
    await database.execute("DELETE FROM purchase_order_items");
    await database.execute("DELETE FROM purchase_orders");
    await database.execute("DELETE FROM sale_items");
    await database.execute("DELETE FROM sales");
    await database.execute("DELETE FROM expenses");
    await database.execute("DELETE FROM products");
    await database.execute("DELETE FROM suppliers");
    await database.execute("DELETE FROM local_users");
    await database.execute("DELETE FROM product_categories");
    await database.execute(
      "DELETE FROM sqlite_sequence WHERE name IN ('stock_movements', 'purchase_order_items', 'purchase_orders', 'sale_items', 'sales', 'expenses', 'products', 'suppliers', 'local_users', 'product_categories')",
    );
  } catch (error) {
    throw error;
  }

  await seedProducts();
}
