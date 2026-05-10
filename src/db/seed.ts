import { db } from "./index";
import { products, productCategories } from "./schema";
import { sql } from "drizzle-orm";

const sampleProducts = [
  { name: "Royal Canin Mini Adult", sku: "RC-MINI-01", barcode: "8935095611456", categoryName: "Thức ăn", brand: "Royal Canin", costPrice: 350000, sellingPrice: 420000, stockQuantity: 25, unit: "bao" },
  { name: "Pate Whiskas vị cá ngừ", sku: "WK-PATE-01", barcode: "8935095622001", categoryName: "Thức ăn", brand: "Whiskas", costPrice: 12000, sellingPrice: 18000, stockQuantity: 120, unit: "gói" },
  { name: "Dây xích dắt chó 1.5m", sku: "PK-LEASH-01", barcode: "8935095633001", categoryName: "Phụ kiện", brand: "PetPro", costPrice: 45000, sellingPrice: 75000, stockQuantity: 30, unit: "cái" },
  { name: "Vòng cổ mèo có chuông", sku: "PK-COLLAR-01", barcode: "8935095633002", categoryName: "Phụ kiện", brand: "CatLife", costPrice: 25000, sellingPrice: 45000, stockQuantity: 50, unit: "cái" },
  { name: "Thuốc xổ giun Drontal", sku: "MED-DRON-01", barcode: "8935095644001", categoryName: "Thuốc & Vitamin", brand: "Bayer", costPrice: 35000, sellingPrice: 55000, stockQuantity: 3, lowStockThreshold: 10, unit: "viên" },
  { name: "Vitamin E cho chó mèo", sku: "MED-VITE-01", barcode: "8935095644002", categoryName: "Thuốc & Vitamin", brand: "Vetripharm", costPrice: 85000, sellingPrice: 120000, stockQuantity: 18, unit: "lọ" },
  { name: "Bóng cao su gặm chó", sku: "TOY-BALL-01", barcode: "8935095655001", categoryName: "Đồ chơi", brand: "PetFun", costPrice: 20000, sellingPrice: 35000, stockQuantity: 40, unit: "cái" },
  { name: "Cát vệ sinh mèo 5L", sku: "HYG-LITTER-01", barcode: "8935095666001", categoryName: "Vệ sinh", brand: "CatSand", costPrice: 55000, sellingPrice: 85000, stockQuantity: 2, lowStockThreshold: 5, unit: "bao" },
  { name: "Sữa tắm trị nấm chó", sku: "HYG-SHAMP-01", barcode: "8935095666002", categoryName: "Vệ sinh", brand: "Bio-Clean", costPrice: 65000, sellingPrice: 95000, stockQuantity: 15, unit: "chai" },
  { name: "Tắm spa cho mèo", sku: "SVC-SPA-01", barcode: "8935095677001", categoryName: "Dịch vụ", brand: "", costPrice: 50000, sellingPrice: 150000, stockQuantity: 999, unit: "lần" },
];

export async function seedProducts() {
  try {
    // Check if we already have products
    const existing = await db.select({ count: sql<number>`count(*)` }).from(products);
    if (existing[0] && existing[0].count > 0) return;

    // Fetch categories to map name -> id
    const categories = await db.select().from(productCategories);
    const categoryMap = new Map(categories.map((c) => [c.name, c.id]));

    for (const p of sampleProducts) {
      await db.insert(products).values({
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        categoryId: categoryMap.get(p.categoryName) ?? null,
        brand: p.brand,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        stockQuantity: p.stockQuantity,
        lowStockThreshold: p.lowStockThreshold ?? 5,
        unit: p.unit,
        allowDirectSale: true,
        trackBatch: false,
      });
    }
    console.log("Seed data inserted");
  } catch (err) {
    console.error("Seed failed:", err);
  }
}
