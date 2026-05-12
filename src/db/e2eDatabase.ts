interface E2eProduct {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  category_id: number | null;
  category_name: string | null;
  brand: string | null;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  unit: string | null;
  description: string | null;
  track_batch: boolean;
  allow_direct_sale: boolean;
  created_at: string;
  updated_at: string;
}

const categories = [
  { id: 1, name: "Thức ăn", created_at: "2026-01-01 08:00:00" },
  { id: 2, name: "Phụ kiện", created_at: "2026-01-01 08:00:00" },
  { id: 3, name: "Thuốc & Vitamin", created_at: "2026-01-01 08:00:00" },
];

const products: E2eProduct[] = [
  {
    id: 1,
    name: "Royal Canin Mini Adult",
    sku: "RC-MINI-01",
    barcode: "8935095611456",
    category_id: 1,
    category_name: "Thức ăn",
    brand: "Royal Canin",
    cost_price: 350000,
    selling_price: 420000,
    stock_quantity: 25,
    low_stock_threshold: 5,
    unit: "bao",
    description: null,
    track_batch: false,
    allow_direct_sale: true,
    created_at: "2026-01-05 08:00:00",
    updated_at: "2026-01-05 08:00:00",
  },
  {
    id: 2,
    name: "Pate Whiskas vị cá ngừ",
    sku: "WK-PATE-01",
    barcode: "8935095622001",
    category_id: 1,
    category_name: "Thức ăn",
    brand: "Whiskas",
    cost_price: 12000,
    selling_price: 18000,
    stock_quantity: 120,
    low_stock_threshold: 10,
    unit: "gói",
    description: null,
    track_batch: false,
    allow_direct_sale: true,
    created_at: "2026-01-06 08:00:00",
    updated_at: "2026-01-06 08:00:00",
  },
  {
    id: 3,
    name: "Cát vệ sinh mèo 5L",
    sku: "HYG-LITTER-01",
    barcode: "8935095666001",
    category_id: null,
    category_name: null,
    brand: "CatSand",
    cost_price: 55000,
    selling_price: 85000,
    stock_quantity: 2,
    low_stock_threshold: 5,
    unit: "bao",
    description: null,
    track_batch: false,
    allow_direct_sale: true,
    created_at: "2026-01-07 08:00:00",
    updated_at: "2026-01-07 08:00:00",
  },
];

const suppliers = [
  {
    id: 1,
    name: "Nhà phân phối PetCare",
    phone: "0900000000",
    email: null,
    address: null,
    note: null,
    created_at: "2026-01-01 08:00:00",
  },
];

const stockMovements = [
  {
    id: 1,
    product_id: 1,
    product_name: "Royal Canin Mini Adult",
    sku: "RC-MINI-01",
    type: "opening",
    quantity_change: 25,
    quantity_before: 0,
    quantity_after: 25,
    unit_cost: 350000,
    reference_type: "seed",
    reference_id: null,
    note: "Tồn đầu kỳ",
    created_at: "2026-01-05 08:00:00",
  },
  {
    id: 2,
    product_id: 3,
    product_name: "Cát vệ sinh mèo 5L",
    sku: "HYG-LITTER-01",
    type: "purchase",
    quantity_change: 2,
    quantity_before: 0,
    quantity_after: 2,
    unit_cost: 55000,
    reference_type: "purchase_order",
    reference_id: 1,
    note: "Nhập hàng",
    created_at: "2026-01-07 08:00:00",
  },
];

const purchaseOrders = [
  {
    id: 1,
    supplier_id: 1,
    supplier_name: "Nhà phân phối PetCare",
    invoice_no: "PN-001",
    purchase_date: "2026-01-07",
    total_amount: 110000,
    note: null,
    created_at: "2026-01-07 08:00:00",
  },
];

const localUsers = [
  {
    id: 1,
    name: "Chủ shop",
    role: "owner",
    pin: "1234",
    active: true,
    created_at: "2026-01-01 08:00:00",
  },
];

function normalizeSql(query: string) {
  return query.replace(/\s+/g, " ").toLowerCase();
}

function filterProducts(params: unknown[] = []) {
  const hasPagination =
    params.length >= 2 &&
    typeof params[params.length - 1] === "number" &&
    typeof params[params.length - 2] === "number";
  const filterParams = hasPagination ? params.slice(0, -2) : params;
  const hasSearch =
    filterParams.length >= 3 && String(filterParams[0]).startsWith("%");
  const search = hasSearch
    ? String(filterParams[0]).replace(/%/g, "").toLowerCase()
    : "";
  const categoryParam = (
    hasSearch ? filterParams[3] : filterParams[0]
  ) as number | undefined;

  return products.filter((product) => {
    const matchesSearch =
      !search ||
      product.name.toLowerCase().includes(search) ||
      product.sku.toLowerCase().includes(search) ||
      product.barcode?.toLowerCase().includes(search);
    const matchesCategory =
      categoryParam == null || product.category_id === categoryParam;
    return matchesSearch && matchesCategory;
  });
}

export function createE2eDatabase() {
  return {
    async select<T>(query: string, params: unknown[] = []): Promise<T> {
      const sql = normalizeSql(query);

      if (sql.includes("sqlite_master")) return [] as T;
      if (sql.includes("__petoneai_migrations")) return [{ id: "e2e" }] as T;
      if (sql.includes("count(*) as total from products")) {
        return [{ total: filterProducts(params).length }] as T;
      }
      if (sql.includes("from products") && sql.includes("left join")) {
        return filterProducts(params) as T;
      }
      if (sql.includes("from products") && sql.includes("order by name")) {
        return products.map(({ category_name: _categoryName, ...product }) => product) as T;
      }
      if (sql.includes("from product_categories")) return categories as T;
      if (sql.includes("from suppliers")) return suppliers as T;
      if (sql.includes("from purchase_orders")) return purchaseOrders as T;
      if (sql.includes("from stock_movements")) return stockMovements as T;
      if (sql.includes("from local_users")) return localUsers as T;
      if (sql.includes("count(*) as product_count")) {
        return [
          {
            product_count: products.length,
            stock_units: products.reduce((sum, item) => sum + item.stock_quantity, 0),
            stock_value: products.reduce(
              (sum, item) => sum + item.stock_quantity * item.cost_price,
              0,
            ),
            low_stock_count: products.filter(
              (item) => item.stock_quantity <= item.low_stock_threshold,
            ).length,
          },
        ] as T;
      }
      if (sql.includes("group by products.id")) {
        return [] as T;
      }
      if (sql.includes("from sale_items")) {
        return [{ revenue: 0, gross_profit: 0, sold_units: 0 }] as T;
      }
      if (sql.includes("from purchase_order_items")) {
        return [{ purchased_units: 2 }] as T;
      }
      if (sql.includes("where stock_quantity <=")) {
        return products.filter(
          (item) => item.stock_quantity <= item.low_stock_threshold,
        ) as T;
      }
      if (sql.includes("group by type")) {
        return [
          { type: "opening", quantity: 25 },
          { type: "purchase", quantity: 2 },
        ] as T;
      }

      return [] as T;
    },

    async execute() {
      return { rowsAffected: 0, lastInsertId: 0 };
    },
  };
}
