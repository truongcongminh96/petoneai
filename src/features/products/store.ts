import { create } from "zustand";
import { getSupabase } from "@/db/supabase";
import type { Database } from "@/db/supabase";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
type ProductCategoryRow =
  Database["public"]["Tables"]["product_categories"]["Row"];

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  categoryId: number | null;
  brand: string | null;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  unit: string | null;
  description: string | null;
  trackBatch: boolean;
  allowDirectSale: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListRow {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  category_name: string | null;
  brand: string | null;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  unit: string | null;
}

export interface ProductCategory {
  id: number;
  name: string;
  createdAt: string;
}

interface ProductInput {
  name: string;
  sku: string;
  barcode?: string;
  categoryId?: number | null;
  brand?: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  unit?: string;
  description?: string;
  trackBatch?: boolean;
  allowDirectSale?: boolean;
}

interface ProductsState {
  items: ProductListRow[];
  categories: ProductCategory[];
  total: number;
  loading: boolean;
  error: string | null;
  search: string;
  categoryFilter: number | null;
  page: number;
  pageSize: number;
  setSearch: (search: string) => void;
  setCategoryFilter: (id: number | null) => void;
  setPage: (page: number) => void;
  loadProducts: () => Promise<void>;
  loadCategories: () => Promise<void>;
  createProduct: (data: ProductInput) => Promise<void>;
  updateProduct: (id: number, data: Partial<ProductInput>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  getProductById: (id: number) => Promise<Product | undefined>;
}

type ProductWithCategory = ProductRow & {
  product_categories: { name: string } | null;
};

function nullableText(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toProductInsert(data: ProductInput): ProductInsert {
  return {
    name: data.name.trim(),
    sku: data.sku.trim(),
    barcode: nullableText(data.barcode),
    category_id: data.categoryId ?? null,
    brand: nullableText(data.brand),
    cost_price: data.costPrice,
    selling_price: data.sellingPrice,
    stock_quantity: data.stockQuantity,
    low_stock_threshold: data.lowStockThreshold ?? 5,
    unit: nullableText(data.unit) ?? "cái",
    description: nullableText(data.description),
    track_batch: data.trackBatch ?? false,
    allow_direct_sale: data.allowDirectSale ?? true,
  };
}

function toProductUpdate(data: Partial<ProductInput>): ProductUpdate {
  const update: ProductUpdate = {};

  if (data.name !== undefined) update.name = data.name.trim();
  if (data.sku !== undefined) update.sku = data.sku.trim();
  if (data.barcode !== undefined) update.barcode = nullableText(data.barcode);
  if (data.categoryId !== undefined) update.category_id = data.categoryId;
  if (data.brand !== undefined) update.brand = nullableText(data.brand);
  if (data.costPrice !== undefined) update.cost_price = data.costPrice;
  if (data.sellingPrice !== undefined) update.selling_price = data.sellingPrice;
  if (data.stockQuantity !== undefined) {
    update.stock_quantity = data.stockQuantity;
  }
  if (data.lowStockThreshold !== undefined) {
    update.low_stock_threshold = data.lowStockThreshold;
  }
  if (data.unit !== undefined) update.unit = nullableText(data.unit) ?? "cái";
  if (data.description !== undefined) {
    update.description = nullableText(data.description);
  }
  if (data.trackBatch !== undefined) update.track_batch = data.trackBatch;
  if (data.allowDirectSale !== undefined) {
    update.allow_direct_sale = data.allowDirectSale;
  }

  return update;
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    barcode: row.barcode,
    categoryId: row.category_id,
    brand: row.brand,
    costPrice: row.cost_price,
    sellingPrice: row.selling_price,
    stockQuantity: row.stock_quantity,
    lowStockThreshold: row.low_stock_threshold,
    unit: row.unit,
    description: row.description,
    trackBatch: row.track_batch,
    allowDirectSale: row.allow_direct_sale,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toProductListRow(row: ProductWithCategory): ProductListRow {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    barcode: row.barcode,
    category_name: row.product_categories?.name ?? null,
    brand: row.brand,
    cost_price: row.cost_price,
    selling_price: row.selling_price,
    stock_quantity: row.stock_quantity,
    low_stock_threshold: row.low_stock_threshold,
    unit: row.unit,
  };
}

function toCategory(row: ProductCategoryRow): ProductCategory {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };
}

function escapeSearchTerm(value: string) {
  return value.trim().replace(/[%,()]/g, " ");
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected Supabase error";
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  items: [],
  categories: [],
  total: 0,
  loading: false,
  error: null,
  search: "",
  categoryFilter: null,
  page: 1,
  pageSize: 20,

  setSearch: (search) => {
    set({ search, page: 1 });
    void get().loadProducts();
  },

  setCategoryFilter: (id) => {
    set({ categoryFilter: id, page: 1 });
    void get().loadProducts();
  },

  setPage: (page) => {
    set({ page });
    void get().loadProducts();
  },

  loadProducts: async () => {
    set({ loading: true, error: null });

    try {
      const { search, categoryFilter, page, pageSize } = get();
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const supabase = getSupabase();

      let query = supabase
        .from("products")
        .select("*, product_categories(name)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      const searchTerm = escapeSearchTerm(search);
      if (searchTerm) {
        query = query.or(
          `name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`,
        );
      }

      if (categoryFilter) {
        query = query.eq("category_id", categoryFilter);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      set({
        items: ((data ?? []) as ProductWithCategory[]).map(toProductListRow),
        total: count ?? 0,
        loading: false,
      });
    } catch (error) {
      console.error("Failed to load products:", error);
      set({ error: getErrorMessage(error), loading: false });
    }
  },

  loadCategories: async () => {
    try {
      const { data, error } = await getSupabase()
        .from("product_categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      set({ categories: (data ?? []).map(toCategory), error: null });
    } catch (error) {
      console.error("Failed to load categories:", error);
      set({ error: getErrorMessage(error) });
    }
  },

  createProduct: async (data) => {
    const { error } = await getSupabase()
      .from("products")
      .insert(toProductInsert(data));

    if (error) throw error;
    await get().loadProducts();
  },

  updateProduct: async (id, data) => {
    const { error } = await getSupabase()
      .from("products")
      .update(toProductUpdate(data))
      .eq("id", id);

    if (error) throw error;
    await get().loadProducts();
  },

  deleteProduct: async (id) => {
    const { error } = await getSupabase().from("products").delete().eq("id", id);

    if (error) throw error;
    await get().loadProducts();
  },

  getProductById: async (id) => {
    const { data, error } = await getSupabase()
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data ? toProduct(data) : undefined;
  },
}));
