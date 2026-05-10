import { create } from "zustand";
import { db, getDb } from "@/db";
import { products, productCategories } from "@/db/schema";
import type { Product, ProductCategory, NewProduct } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

interface ProductsState {
  // Data
  items: Product[];
  categories: ProductCategory[];
  total: number;
  loading: boolean;

  // Filters
  search: string;
  categoryFilter: number | null;
  page: number;
  pageSize: number;

  // Actions
  setSearch: (search: string) => void;
  setCategoryFilter: (id: number | null) => void;
  setPage: (page: number) => void;
  loadProducts: () => Promise<void>;
  loadCategories: () => Promise<void>;
  createProduct: (data: NewProduct) => Promise<void>;
  updateProduct: (id: number, data: Partial<NewProduct>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  getProductById: (id: number) => Promise<Product | undefined>;
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  items: [],
  categories: [],
  total: 0,
  loading: false,

  search: "",
  categoryFilter: null,
  page: 1,
  pageSize: 20,

  setSearch: (search) => {
    set({ search, page: 1 });
    get().loadProducts();
  },

  setCategoryFilter: (id) => {
    set({ categoryFilter: id, page: 1 });
    get().loadProducts();
  },

  setPage: (page) => {
    set({ page });
    get().loadProducts();
  },

  loadProducts: async () => {
    set({ loading: true });
    try {
      const { search, categoryFilter, page, pageSize } = get();
      const offset = (page - 1) * pageSize;

      // Build where conditions as raw SQL for flexibility
      const conditions: string[] = [];
      const params: any[] = [];

      if (search) {
        conditions.push(
          "(products.name LIKE ? OR products.sku LIKE ? OR products.barcode LIKE ?)",
        );
        const s = `%${search}%`;
        params.push(s, s, s);
      }

      if (categoryFilter) {
        conditions.push("products.category_id = ?");
        params.push(categoryFilter);
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      // Count
      const dbRaw = await getDb();
      const countResult = await dbRaw.select<{ total: number }[]>(
        `SELECT COUNT(*) as total FROM products ${whereClause}`,
        params,
      );
      const total = countResult[0]?.total ?? 0;

      // Fetch rows
      const rows = await dbRaw.select<any[]>(
        `SELECT products.*, product_categories.name as category_name
         FROM products
         LEFT JOIN product_categories ON products.category_id = product_categories.id
         ${whereClause}
         ORDER BY products.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, pageSize, offset],
      );

      set({ items: rows as any, total, loading: false });
    } catch (err) {
      console.error("Failed to load products:", err);
      set({ loading: false });
    }
  },

  loadCategories: async () => {
    try {
      const cats = await db.select().from(productCategories);
      set({ categories: cats });
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  },

  createProduct: async (data) => {
    await db.insert(products).values(data);
    await get().loadProducts();
  },

  updateProduct: async (id, data) => {
    await db
      .update(products)
      .set({ ...data, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(products.id, id));
    await get().loadProducts();
  },

  deleteProduct: async (id) => {
    await db.delete(products).where(eq(products.id, id));
    await get().loadProducts();
  },

  getProductById: async (id) => {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return result[0];
  },
}));
