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
// TypeScript types inferred from schema
// ---------------------------------------------------------------------------
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductCategory = typeof productCategories.$inferSelect;
export type NewProductCategory = typeof productCategories.$inferInsert;
