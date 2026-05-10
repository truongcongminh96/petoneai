import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Download } from "lucide-react";
import { useProductsStore } from "./store";
import { EmptyState } from "@/shared/EmptyState";
import * as XLSX from "xlsx";

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
  return new Intl.NumberFormat("vi-VN").format(amount) + "₫";
}

interface ProductTableProps {
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export function ProductTable({ onEdit, onDelete }: ProductTableProps) {
  const items = useProductsStore((s) => s.items) as unknown as ProductRow[];
  const loading = useProductsStore((s) => s.loading);
  const page = useProductsStore((s) => s.page);
  const pageSize = useProductsStore((s) => s.pageSize);
  const total = useProductsStore((s) => s.total);
  const setPage = useProductsStore((s) => s.setPage);

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
        <span className="text-sm">
          {row.original.category_name ?? "—"}
        </span>
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
            <span className="text-sm">{qty} {row.original.unit}</span>
            {isLow && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
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
            <DropdownMenuTrigger
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
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

  // Export
  const handleExport = () => {
    const exportData = items.map((p) => ({
      SKU: p.sku,
      "Tên sản phẩm": p.name,
      "Mã vạch": p.barcode ?? "",
      "Danh mục": p.category_name ?? "",
      "Thương hiệu": p.brand ?? "",
      "Giá vốn": p.cost_price,
      "Giá bán": p.selling_price,
      "Tồn kho": p.stock_quantity,
      "Đơn vị": p.unit ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sản phẩm");
    XLSX.writeFile(wb, "petoneai_products.xlsx");
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
      {/* Export button row */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleExport}
        >
          <Download size={14} /> Xuất Excel
        </Button>
      </div>

      {/* Desktop table */}
      <div className="hidden rounded-lg border border-border bg-card md:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
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

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {items.map((p) => (
          <div
            key={p.id}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-medium">{p.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {p.sku}
                  {p.barcode ? ` · ${p.barcode}` : ""}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <MoreHorizontal size={16} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(p.id)}>
                    <Pencil size={14} className="mr-2" />
                    Chỉnh sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(p.id)}
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
                <div className="font-medium">{formatVND(p.selling_price)}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Giá vốn</div>
                <div>{formatVND(p.cost_price)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground">Tồn kho</div>
                <div className="flex items-center justify-end gap-1">
                  <span>{p.stock_quantity}</span>
                  {p.stock_quantity <= p.low_stock_threshold && (
                    <Badge
                      variant="destructive"
                      className="text-[9px] px-1 py-0"
                    >
                      Sắp hết
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
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
