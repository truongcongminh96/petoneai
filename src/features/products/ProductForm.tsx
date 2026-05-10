import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { productFormSchema, type ProductFormValues } from "./schema";
import { useProductsStore } from "./store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface ProductFormProps {
  defaultValues?: Partial<ProductFormValues>;
  onSubmit: (data: ProductFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function ProductForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Lưu sản phẩm",
}: ProductFormProps) {
  const categories = useProductsStore((s) => s.categories);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: standardSchemaResolver(productFormSchema),
    defaultValues: {
      name: "",
      sku: "",
      barcode: "",
      categoryId: null,
      brand: "",
      costPrice: 0,
      sellingPrice: 0,
      stockQuantity: 0,
      lowStockThreshold: 5,
      unit: "cái",
      description: "",
      trackBatch: false,
      allowDirectSale: true,
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      reset({
        name: "",
        sku: "",
        barcode: "",
        categoryId: null,
        brand: "",
        costPrice: 0,
        sellingPrice: 0,
        stockQuantity: 0,
        lowStockThreshold: 5,
        unit: "cái",
        description: "",
        trackBatch: false,
        allowDirectSale: true,
        ...defaultValues,
      });
    }
  }, [defaultValues, reset]);

  const trackBatch = watch("trackBatch");
  const allowDirectSale = watch("allowDirectSale");
  const categoryId = watch("categoryId");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Basic Info */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-4 rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Thông tin cơ bản
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Name */}
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="name">
              Tên sản phẩm <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Ví dụ: Royal Canin Mini Adult"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* SKU */}
          <div className="space-y-1.5">
            <Label htmlFor="sku">
              Mã SKU <span className="text-destructive">*</span>
            </Label>
            <Input id="sku" placeholder="RC-MINI-01" {...register("sku")} />
            {errors.sku && (
              <p className="text-xs text-destructive">{errors.sku.message}</p>
            )}
          </div>

          {/* Barcode */}
          <div className="space-y-1.5">
            <Label htmlFor="barcode">Mã vạch</Label>
            <Input
              id="barcode"
              placeholder="8935095611456"
              {...register("barcode")}
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Danh mục</Label>
            <Select
              value={categoryId?.toString() ?? ""}
              onValueChange={(v) =>
                setValue("categoryId", v ? Number(v) : null)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brand */}
          <div className="space-y-1.5">
            <Label htmlFor="brand">Thương hiệu</Label>
            <Input
              id="brand"
              placeholder="Royal Canin"
              {...register("brand")}
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Pricing */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-4 rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Giá & Tồn kho
        </h3>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="costPrice">Giá vốn (₫)</Label>
            <Input
              id="costPrice"
              type="number"
              step="1000"
              min="0"
              {...register("costPrice")}
            />
            {errors.costPrice && (
              <p className="text-xs text-destructive">
                {errors.costPrice.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sellingPrice">
              Giá bán (₫) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sellingPrice"
              type="number"
              step="1000"
              min="0"
              {...register("sellingPrice")}
            />
            {errors.sellingPrice && (
              <p className="text-xs text-destructive">
                {errors.sellingPrice.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="unit">Đơn vị tính</Label>
            <Input id="unit" placeholder="cái" {...register("unit")} />
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="stockQuantity">Tồn kho ban đầu</Label>
            <Input
              id="stockQuantity"
              type="number"
              min="0"
              {...register("stockQuantity")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lowStockThreshold">Cảnh báo tồn kho thấp</Label>
            <Input
              id="lowStockThreshold"
              type="number"
              min="0"
              {...register("lowStockThreshold")}
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Description */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-4 rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Mô tả
        </h3>
        <Textarea
          id="description"
          rows={3}
          placeholder="Ghi chú thêm về sản phẩm..."
          {...register("description")}
        />
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Toggles */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-4 rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Tuỳ chọn
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Quản lý lô / hạn sử dụng</p>
            <p className="text-xs text-muted-foreground">
              Theo dõi số lô và ngày hết hạn cho sản phẩm
            </p>
          </div>
          <Switch
            checked={trackBatch}
            onCheckedChange={(v) => setValue("trackBatch", v)}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Bán hàng trực tiếp</p>
            <p className="text-xs text-muted-foreground">
              Cho phép bán sản phẩm này tại quầy
            </p>
          </div>
          <Switch
            checked={allowDirectSale}
            onCheckedChange={(v) => setValue("allowDirectSale", v)}
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Actions */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Huỷ
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang lưu..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
