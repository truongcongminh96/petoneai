import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import { formatVND, todayInputValue } from "@/lib/format";
import {
  loadInventoryProducts,
  loadPurchaseOrders,
  loadSuppliers,
  receiveStock,
  type InventoryProduct,
  type SupplierRow,
} from "./api";

interface ReceiveLine {
  productId: number;
  quantity: number;
  unitCost: number;
}

const emptyLine: ReceiveLine = {
  productId: 0,
  quantity: 1,
  unitCost: 0,
};

export function Receiving() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [orders, setOrders] = useState<
    Awaited<ReturnType<typeof loadPurchaseOrders>>
  >([]);
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [supplierName, setSupplierName] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(todayInputValue());
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<ReceiveLine[]>([{ ...emptyLine }]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function reload() {
    const [productRows, supplierRows, orderRows] = await Promise.all([
      loadInventoryProducts(),
      loadSuppliers(),
      loadPurchaseOrders(),
    ]);
    setProducts(productRows);
    setSuppliers(supplierRows);
    setOrders(orderRows);
  }

  useEffect(() => {
    reload();
  }, []);

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0),
    [lines],
  );

  function updateLine(index: number, patch: Partial<ReceiveLine>) {
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line,
      ),
    );
  }

  async function handleSubmit() {
    setSaving(true);
    setMessage(null);
    try {
      await receiveStock({
        supplierId,
        supplierName,
        invoiceNo,
        purchaseDate,
        note,
        items: lines,
      });
      setSupplierId(null);
      setSupplierName("");
      setInvoiceNo("");
      setPurchaseDate(todayInputValue());
      setNote("");
      setLines([{ ...emptyLine }]);
      await reload();
      setMessage("Đã lưu phiếu nhập và cập nhật tồn kho.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể nhập hàng.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Tạo phiếu nhập kho</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label>Nhà cung cấp có sẵn</Label>
              <Select
                value={supplierId?.toString() ?? ""}
                onValueChange={(value) => {
                  setSupplierId(value ? Number(value) : null);
                  setSupplierName("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhà cung cấp" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Hoặc nhập nhà cung cấp mới</Label>
              <Input
                value={supplierName}
                placeholder="Tên nhà cung cấp"
                onChange={(event) => {
                  setSupplierName(event.target.value);
                  if (event.target.value) setSupplierId(null);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Số hóa đơn</Label>
              <Input
                value={invoiceNo}
                onChange={(event) => setInvoiceNo(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ngày nhập</Label>
              <Input
                type="date"
                value={purchaseDate}
                onChange={(event) => setPurchaseDate(event.target.value)}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Ghi chú</Label>
              <Input value={note} onChange={(event) => setNote(event.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            {lines.map((line, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3 md:grid-cols-[1fr_120px_140px_44px]"
              >
                <div className="space-y-1.5">
                  <Label>Sản phẩm</Label>
                  <Select
                    value={line.productId ? line.productId.toString() : ""}
                    onValueChange={(value) => {
                      const product = products.find((p) => p.id === Number(value));
                      updateLine(index, {
                        productId: Number(value),
                        unitCost: product?.cost_price ?? line.unitCost,
                      });
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
                  <Label>Số lượng</Label>
                  <Input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(event) =>
                      updateLine(index, { quantity: Number(event.target.value) })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Giá nhập</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1000"
                    value={line.unitCost}
                    onChange={(event) =>
                      updateLine(index, { unitCost: Number(event.target.value) })
                    }
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={lines.length === 1}
                    onClick={() =>
                      setLines((current) =>
                        current.filter((_, lineIndex) => lineIndex !== index),
                      )
                    }
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLines((current) => [...current, { ...emptyLine }])}
            >
              <Plus size={16} /> Thêm dòng
            </Button>
            <div className="text-sm font-medium">
              Tổng tiền nhập: {formatVND(total)}
            </div>
          </div>

          {message && <div className="text-sm text-muted-foreground">{message}</div>}

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu phiếu nhập"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phiếu nhập gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col justify-between gap-1 rounded-lg border border-border p-3 text-sm sm:flex-row"
              >
                <div>
                  <div className="font-medium">
                    #{order.id} {order.invoice_no ? `- ${order.invoice_no}` : ""}
                  </div>
                  <div className="text-muted-foreground">
                    {order.supplier_name ?? "Không có NCC"} · {order.purchase_date}
                  </div>
                </div>
                <div className="font-medium">{formatVND(order.total_amount)}</div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="text-sm text-muted-foreground">
                Chưa có phiếu nhập nào.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
