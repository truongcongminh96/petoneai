import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatVND } from "@/lib/format";
import {
  adjustStock,
  loadInventoryProducts,
  loadStockMovements,
  type InventoryProduct,
  type StockMovementRow,
} from "./api";

const movementLabels: Record<string, string> = {
  opening: "Tồn đầu kỳ",
  purchase: "Nhập hàng",
  sale: "Bán hàng",
  adjustment: "Điều chỉnh",
  return: "Trả hàng",
  import: "Import Excel",
};

export function StockMovements() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [movements, setMovements] = useState<StockMovementRow[]>([]);
  const [productId, setProductId] = useState<number>(0);
  const [targetQuantity, setTargetQuantity] = useState(0);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function reload() {
    const [productRows, movementRows] = await Promise.all([
      loadInventoryProducts(),
      loadStockMovements(),
    ]);
    setProducts(productRows);
    setMovements(movementRows);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleAdjust() {
    setMessage(null);
    try {
      await adjustStock(productId, targetQuantity, note);
      setProductId(0);
      setTargetQuantity(0);
      setNote("");
      await reload();
      setMessage("Đã ghi nhận điều chỉnh kho.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể điều chỉnh.");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Điều chỉnh tồn kho</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_160px_1fr_auto] md:items-end">
          <div className="space-y-1.5">
            <Label>Sản phẩm</Label>
            <Select
              value={productId ? productId.toString() : ""}
              onValueChange={(value) => {
                const nextId = Number(value);
                const product = products.find((item) => item.id === nextId);
                setProductId(nextId);
                setTargetQuantity(product?.stock_quantity ?? 0);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn sản phẩm" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.sku} - {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tồn thực tế</Label>
            <Input
              type="number"
              min="0"
              value={targetQuantity}
              onChange={(event) => setTargetQuantity(Number(event.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Lý do</Label>
            <Textarea
              rows={1}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
          <Button disabled={!productId} onClick={handleAdjust}>
            Ghi nhận
          </Button>
          {message && (
            <div className="text-sm text-muted-foreground md:col-span-4">
              {message}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử tồn kho</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th className="p-3">Thời gian</th>
                  <th className="p-3">Sản phẩm</th>
                  <th className="p-3">Loại</th>
                  <th className="p-3 text-right">Thay đổi</th>
                  <th className="p-3 text-right">Trước</th>
                  <th className="p-3 text-right">Sau</th>
                  <th className="p-3 text-right">Giá vốn</th>
                  <th className="p-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id} className="border-t border-border">
                    <td className="p-3 text-muted-foreground">
                      {movement.created_at}
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{movement.product_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {movement.sku}
                      </div>
                    </td>
                    <td className="p-3">
                      {movementLabels[movement.type] ?? movement.type}
                    </td>
                    <td className="p-3 text-right font-medium">
                      {movement.quantity_change > 0 ? "+" : ""}
                      {movement.quantity_change}
                    </td>
                    <td className="p-3 text-right">{movement.quantity_before}</td>
                    <td className="p-3 text-right">{movement.quantity_after}</td>
                    <td className="p-3 text-right">
                      {movement.unit_cost == null
                        ? "-"
                        : formatVND(movement.unit_cost)}
                    </td>
                    <td className="p-3">{movement.note ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
