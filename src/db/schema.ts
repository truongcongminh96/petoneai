import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Product Categories
// ---------------------------------------------------------------------------
export const productCategories = sqliteTable("product_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  barcode: text("barcode"),
  categoryId: integer("category_id").references(() => productCategories.id),
  brand: text("brand"),
  costPrice: real("cost_price").notNull().default(0),
  sellingPrice: real("selling_price").notNull().default(0),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
  unit: text("unit").default("cái"),
  description: text("description"),
  trackBatch: integer("track_batch", { mode: "boolean" }).notNull().default(false),
  allowDirectSale: integer("allow_direct_sale", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Sales
// ---------------------------------------------------------------------------
export const sales = sqliteTable("sales", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  totalAmount: real("total_amount").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Sale Items
// ---------------------------------------------------------------------------
export const saleItems = sqliteTable("sale_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  saleId: integer("sale_id").notNull().references(() => sales.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
});

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------
export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Suppliers
// ---------------------------------------------------------------------------
export const suppliers = sqliteTable("suppliers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  note: text("note"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Purchase Orders
// ---------------------------------------------------------------------------
export const purchaseOrders = sqliteTable("purchase_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  invoiceNo: text("invoice_no"),
  purchaseDate: text("purchase_date").notNull(),
  totalAmount: real("total_amount").notNull().default(0),
  note: text("note"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const purchaseOrderItems = sqliteTable("purchase_order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  purchaseOrderId: integer("purchase_order_id")
    .notNull()
    .references(() => purchaseOrders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitCost: real("unit_cost").notNull(),
  subtotal: real("subtotal").notNull(),
});

// ---------------------------------------------------------------------------
// Stock Movements
// ---------------------------------------------------------------------------
export const stockMovements = sqliteTable("stock_movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  type: text("type").notNull(),
  quantityChange: integer("quantity_change").notNull(),
  quantityBefore: integer("quantity_before").notNull(),
  quantityAfter: integer("quantity_after").notNull(),
  unitCost: real("unit_cost"),
  referenceType: text("reference_type"),
  referenceId: integer("reference_id"),
  note: text("note"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// Local Users
// ---------------------------------------------------------------------------
export const localUsers = sqliteTable("local_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  role: text("role").notNull().default("owner"),
  pin: text("pin").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ---------------------------------------------------------------------------
// TypeScript types inferred from schema
// ---------------------------------------------------------------------------
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductCategory = typeof productCategories.$inferSelect;
export type NewProductCategory = typeof productCategories.$inferInsert;
export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type NewPurchaseOrder = typeof purchaseOrders.$inferInsert;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type NewPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;
export type StockMovement = typeof stockMovements.$inferSelect;
export type NewStockMovement = typeof stockMovements.$inferInsert;
export type LocalUser = typeof localUsers.$inferSelect;
export type NewLocalUser = typeof localUsers.$inferInsert;
