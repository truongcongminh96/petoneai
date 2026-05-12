import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Download, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/shared/EmptyState";
import { exportProductsToExcel } from "./exportProducts";
import { useProductsStore } from "./store";

interface ProductRow {
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

function formatVND(amount: number) {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;
}

interface ProductTableProps {
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export function ProductTable({ onEdit, onDelete }: ProductTableProps) {
  const items = useProductsStore((state) => state.items) as unknown as ProductRow[];
  const loading = useProductsStore((state) => state.loading);
  const page = useProductsStore((state) => state.page);
  const pageSize = useProductsStore((state) => state.pageSize);
  const total = useProductsStore((state) => state.total);
  const setPage = useProductsStore((state) => state.setPage);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const columns: ColumnDef<ProductRow>[] = [
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.sku}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Tên sản phẩm",
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.name}</span>
          {row.original.barcode && (
            <span className="ml-2 text-[10px] text-muted-foreground">
              {row.original.barcode}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "category_name",
      header: "Danh mục",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.category_name ?? "—"}</span>
      ),
    },
    {
      accessorKey: "cost_price",
      header: () => <span className="block text-right">Giá vốn</span>,
      cell: ({ row }) => (
        <span className="block text-right text-sm text-muted-foreground">
          {formatVND(row.original.cost_price)}
        </span>
      ),
    },
    {
      accessorKey: "selling_price",
      header: () => <span className="block text-right">Giá bán</span>,
      cell: ({ row }) => (
        <span className="block text-right text-sm font-medium">
          {formatVND(row.original.selling_price)}
        </span>
      ),
    },
    {
      accessorKey: "stock_quantity",
      header: () => <span className="block text-right">Tồn kho</span>,
      cell: ({ row }) => {
        const qty = row.original.stock_quantity;
        const threshold = row.original.low_stock_threshold;
        const isLow = qty <= threshold;
        return (
          <div className="flex items-center justify-end gap-2">
            <span className="text-sm">
              {qty} {row.original.unit}
            </span>
            {isLow && (
              <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                Sắp hết
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Thao tác</span>,
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <MoreHorizontal size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(row.original.id)}>
                <Pencil size={14} className="mr-2" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(row.original.id)}
              >
                <Trash2 size={14} className="mr-2" />
                Xoá
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleExport = async () => {
    setExporting(true);
    setExportMessage(null);
    try {
      const savedPath = await exportProductsToExcel();
      setExportMessage(`Đã xuất Excel: ${savedPath}`);
    } catch (error) {
      setExportMessage(
        error instanceof Error
          ? `Không xuất được Excel: ${error.message}`
          : "Không xuất được Excel.",
      );
    } finally {
      setExporting(false);
    }
  };

  if (!loading && items.length === 0) {
    return (
      <EmptyState
        title="Chưa có sản phẩm nào"
        description="Hãy thêm sản phẩm đầu tiên vào kho hàng của bạn."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleExport}
          disabled={exporting}
        >
          <Download size={14} />
          {exporting ? "Đang xuất..." : "Xuất Excel"}
        </Button>
      </div>

      {exportMessage && (
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {exportMessage}
        </div>
      )}

      <div className="hidden rounded-lg border border-border bg-card md:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden">
        {items.map((product) => (
          <div
            key={product.id}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-medium">{product.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {product.sku}
                  {product.barcode ? ` · ${product.barcode}` : ""}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <MoreHorizontal size={16} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(product.id)}>
                    <Pencil size={14} className="mr-2" />
                    Chỉnh sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(product.id)}
                  >
                    <Trash2 size={14} className="mr-2" />
                    Xoá
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-[10px] text-muted-foreground">Giá bán</div>
                <div className="font-medium">
                  {formatVND(product.selling_price)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Giá vốn</div>
                <div>{formatVND(product.cost_price)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground">Tồn kho</div>
                <div className="flex items-center justify-end gap-1">
                  <span>{product.stock_quantity}</span>
                  {product.stock_quantity <= product.low_stock_threshold && (
                    <Badge variant="destructive" className="px-1 py-0 text-[9px]">
                      Sắp hết
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-sm">
          <span className="text-muted-foreground">
            Trang {page}/{totalPages} · {total} sản phẩm
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
