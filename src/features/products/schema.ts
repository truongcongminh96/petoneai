import { z } from "zod";

export const productFormSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm không được để trống"),
  sku: z.string().min(1, "Mã SKU không được để trống"),
  barcode: z.string().optional().default(""),
  categoryId: z.coerce.number().nullable().optional().default(null),
  brand: z.string().optional().default(""),
  costPrice: z.coerce.number().min(0, "Giá vốn phải ≥ 0"),
  sellingPrice: z.coerce.number().min(0, "Giá bán phải ≥ 0"),
  stockQuantity: z.coerce.number().int().min(0, "Tồn kho phải ≥ 0"),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  unit: z.string().optional().default("cái"),
  description: z.string().optional().default(""),
  trackBatch: z.boolean().optional().default(false),
  allowDirectSale: z.boolean().optional().default(true),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
