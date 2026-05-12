import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  commitProductImport,
  normalizeProductImportRows,
  type ProductImportRow,
} from "./importProducts";

interface ProductImportPanelProps {
  onImported: () => Promise<void>;
}

export function ProductImportPanel({ onImported }: ProductImportPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ProductImportRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const validCount = rows.filter((row) => row.errors.length === 0).length;
  const errorCount = rows.length - validCount;

  async function handleFile(file: File) {
    setMessage(null);
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      firstSheet,
      { defval: "" },
    );
    setRows(await normalizeProductImportRows(jsonRows));
    setOpen(true);
  }

  async function handleCommit() {
    setSaving(true);
    setMessage(null);
    try {
      const count = await commitProductImport(rows);
      await onImported();
      setRows([]);
      setMessage(`Đã import ${count} dòng hợp lệ.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import thất bại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Import Excel</CardTitle>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={16} /> Chọn file
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(!open)}>
            {open ? "Ẩn" : "Hiện"}
          </Button>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Cột hỗ trợ: SKU, Tên sản phẩm, Mã vạch, Danh mục, Thương hiệu, Giá
            vốn, Giá bán, Tồn kho, Đơn vị.
          </div>
          {message && <div className="text-sm text-muted-foreground">{message}</div>}
          {rows.length > 0 && (
            <>
              <div className="text-sm">
                Hợp lệ: <b>{validCount}</b> · Lỗi: <b>{errorCount}</b>
              </div>
              <div className="max-h-80 overflow-auto rounded-lg border border-border">
                <table className="w-full min-w-[860px] text-sm">
                  <thead className="bg-muted/60 text-left">
                    <tr>
                      <th className="p-3">Dòng</th>
                      <th className="p-3">Trạng thái</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3">Tên</th>
                      <th className="p-3">Danh mục</th>
                      <th className="p-3 text-right">Giá bán</th>
                      <th className="p-3 text-right">Tồn</th>
                      <th className="p-3">Lỗi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 100).map((row) => (
                      <tr key={row.rowNumber} className="border-t border-border">
                        <td className="p-3">{row.rowNumber}</td>
                        <td className="p-3">
                          {row.mode === "create" ? "Tạo mới" : "Cập nhật"}
                        </td>
                        <td className="p-3 font-mono text-xs">{row.sku}</td>
                        <td className="p-3">{row.name}</td>
                        <td className="p-3">{row.categoryName}</td>
                        <td className="p-3 text-right">{row.sellingPrice}</td>
                        <td className="p-3 text-right">{row.stockQuantity}</td>
                        <td className="p-3 text-destructive">
                          {row.errors.join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  disabled={validCount === 0 || errorCount > 0 || saving}
                  onClick={handleCommit}
                >
                  {saving ? "Đang import..." : "Ghi vào kho"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
