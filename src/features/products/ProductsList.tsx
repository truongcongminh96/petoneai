import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProductsStore } from "./store";
import { ProductFilters } from "./ProductFilters";
import { ProductTable } from "./ProductTable";
import { ProductDialog } from "./ProductDialog";
import { ProductImportPanel } from "./ProductImportPanel";
import type { ProductFormValues } from "./schema";

export function ProductsList() {
  const loadProducts = useProductsStore((s) => s.loadProducts);
  const loadCategories = useProductsStore((s) => s.loadCategories);
  const createProduct = useProductsStore((s) => s.createProduct);
  const updateProduct = useProductsStore((s) => s.updateProduct);
  const deleteProduct = useProductsStore((s) => s.deleteProduct);
  const getProductById = useProductsStore((s) => s.getProductById);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDefaults, setEditDefaults] = useState<
    Partial<ProductFormValues> | undefined
  >(undefined);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [loadProducts, loadCategories]);

  // Create
  const handleCreate = useCallback(async (data: ProductFormValues) => {
    await createProduct(data);
  }, [createProduct]);

  // Edit – load current data
  const handleOpenEdit = useCallback(
    async (id: number) => {
      const product = await getProductById(id);
      if (!product) return;
      setEditingId(id);
      setEditDefaults({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode ?? "",
        categoryId: product.categoryId,
        brand: product.brand ?? "",
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        stockQuantity: product.stockQuantity,
        lowStockThreshold: product.lowStockThreshold,
        unit: product.unit ?? "cái",
        description: product.description ?? "",
        trackBatch: product.trackBatch,
        allowDirectSale: product.allowDirectSale,
      });
      setDialogOpen(true);
    },
    [getProductById],
  );

  const handleEditSubmit = useCallback(
    async (data: ProductFormValues) => {
      if (editingId == null) return;
      await updateProduct(editingId, data);
      setEditingId(null);
      setEditDefaults(undefined);
    },
    [editingId, updateProduct],
  );

  // Delete
  const handleDelete = useCallback(
    async (id: number) => {
      if (!window.confirm("Bạn có chắc muốn xoá sản phẩm này?")) return;
      await deleteProduct(id);
    },
    [deleteProduct],
  );

  // Dialog close resets edit state
  const handleDialogChange = useCallback(
    (open: boolean) => {
      setDialogOpen(open);
      if (!open) {
        setEditingId(null);
        setEditDefaults(undefined);
      }
    },
    [],
  );

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Kho hàng</h2>
        <Button
          className="gap-2"
          onClick={() => {
            setEditingId(null);
            setEditDefaults(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus size={16} /> Thêm sản phẩm
        </Button>
      </div>

      {/* Filters */}
      <ProductImportPanel
        onImported={async () => {
          await loadCategories();
          await loadProducts();
        }}
      />

      <ProductFilters />

      {/* Table */}
      <ProductTable onEdit={handleOpenEdit} onDelete={handleDelete} />

      {/* Create / Edit dialog */}
      <ProductDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        title={editingId ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
        defaultValues={editDefaults}
        onSubmit={editingId ? handleEditSubmit : handleCreate}
        submitLabel={editingId ? "Cập nhật" : "Thêm sản phẩm"}
      />
    </div>
  );
}
