import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDb } from "@/db";
import { formatVND } from "@/lib/format";

interface ReportSummary {
  productCount: number;
  stockUnits: number;
  stockValue: number;
  lowStockCount: number;
  revenue: number;
  grossProfit: number;
  purchasedUnits: number;
  soldUnits: number;
}

interface LowStockRow {
  id: number;
  name: string;
  sku: string;
  stock_quantity: number;
  low_stock_threshold: number;
}

interface BestSellerRow {
  product_name: string;
  sku: string;
  quantity: number;
  revenue: number;
}

interface FlowRow {
  type: string;
  quantity: number;
}

const emptySummary: ReportSummary = {
  productCount: 0,
  stockUnits: 0,
  stockValue: 0,
  lowStockCount: 0,
  revenue: 0,
  grossProfit: 0,
  purchasedUnits: 0,
  soldUnits: 0,
};

export function Reports() {
  const [summary, setSummary] = useState<ReportSummary>(emptySummary);
  const [lowStock, setLowStock] = useState<LowStockRow[]>([]);
  const [bestSellers, setBestSellers] = useState<BestSellerRow[]>([]);
  const [flows, setFlows] = useState<FlowRow[]>([]);

  useEffect(() => {
    async function load() {
      const database = await getDb();
      const productStats = (
        await database.select<
          {
            product_count: number;
            stock_units: number;
            stock_value: number;
            low_stock_count: number;
          }[]
        >(
          `SELECT
             COUNT(*) as product_count,
             COALESCE(SUM(stock_quantity), 0) as stock_units,
             COALESCE(SUM(stock_quantity * cost_price), 0) as stock_value,
             COALESCE(SUM(CASE WHEN stock_quantity <= low_stock_threshold THEN 1 ELSE 0 END), 0) as low_stock_count
           FROM products`,
        )
      )[0];

      const salesStats = (
        await database.select<
          { revenue: number; gross_profit: number; sold_units: number }[]
        >(
          `SELECT
             COALESCE(SUM(sale_items.quantity * sale_items.unit_price), 0) as revenue,
             COALESCE(SUM(sale_items.quantity * (sale_items.unit_price - products.cost_price)), 0) as gross_profit,
             COALESCE(SUM(sale_items.quantity), 0) as sold_units
           FROM sale_items
           JOIN products ON products.id = sale_items.product_id`,
        )
      )[0];

      const purchaseStats = (
        await database.select<{ purchased_units: number }[]>(
          `SELECT COALESCE(SUM(quantity), 0) as purchased_units
           FROM purchase_order_items`,
        )
      )[0];

      const lowRows = await database.select<LowStockRow[]>(
        `SELECT id, name, sku, stock_quantity, low_stock_threshold
         FROM products
         WHERE stock_quantity <= low_stock_threshold
         ORDER BY stock_quantity ASC, name ASC
         LIMIT 20`,
      );

      const sellerRows = await database.select<BestSellerRow[]>(
        `SELECT
           products.name as product_name,
           products.sku as sku,
           COALESCE(SUM(sale_items.quantity), 0) as quantity,
           COALESCE(SUM(sale_items.quantity * sale_items.unit_price), 0) as revenue
         FROM sale_items
         JOIN products ON products.id = sale_items.product_id
         GROUP BY products.id
         ORDER BY quantity DESC
         LIMIT 10`,
      );

      const flowRows = await database.select<FlowRow[]>(
        `SELECT type, COALESCE(SUM(quantity_change), 0) as quantity
         FROM stock_movements
         GROUP BY type
         ORDER BY type ASC`,
      );

      setSummary({
        productCount: productStats?.product_count ?? 0,
        stockUnits: productStats?.stock_units ?? 0,
        stockValue: productStats?.stock_value ?? 0,
        lowStockCount: productStats?.low_stock_count ?? 0,
        revenue: salesStats?.revenue ?? 0,
        grossProfit: salesStats?.gross_profit ?? 0,
        soldUnits: salesStats?.sold_units ?? 0,
        purchasedUnits: purchaseStats?.purchased_units ?? 0,
      });
      setLowStock(lowRows);
      setBestSellers(sellerRows);
      setFlows(flowRows);
    }

    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Mặt hàng" value={summary.productCount.toString()} />
        <MetricCard title="Tổng tồn" value={summary.stockUnits.toString()} />
        <MetricCard title="Giá trị tồn" value={formatVND(summary.stockValue)} />
        <MetricCard title="Sắp hết" value={summary.lowStockCount.toString()} />
        <MetricCard title="Doanh thu" value={formatVND(summary.revenue)} />
        <MetricCard title="Lợi nhuận gộp" value={formatVND(summary.grossProfit)} />
        <MetricCard title="Đã nhập" value={summary.purchasedUnits.toString()} />
        <MetricCard title="Đã bán" value={summary.soldUnits.toString()} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Hàng sắp hết</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStock.map((row) => (
              <div key={row.id} className="rounded-lg border border-border p-3">
                <div className="font-medium">{row.name}</div>
                <div className="text-sm text-muted-foreground">
                  {row.sku} · tồn {row.stock_quantity} / cảnh báo{" "}
                  {row.low_stock_threshold}
                </div>
              </div>
            ))}
            {lowStock.length === 0 && (
              <div className="text-sm text-muted-foreground">
                Không có sản phẩm sắp hết.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hàng bán chạy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {bestSellers.map((row) => (
              <div key={row.sku} className="rounded-lg border border-border p-3">
                <div className="font-medium">{row.product_name}</div>
                <div className="text-sm text-muted-foreground">
                  {row.sku} · {row.quantity} sp · {formatVND(row.revenue)}
                </div>
              </div>
            ))}
            {bestSellers.length === 0 && (
              <div className="text-sm text-muted-foreground">
                Chưa có dữ liệu bán hàng.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nhập - xuất - tồn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {flows.map((row) => (
              <div
                key={row.type}
                className="flex justify-between rounded-lg border border-border p-3 text-sm"
              >
                <span>{row.type}</span>
                <span className="font-medium">{row.quantity}</span>
              </div>
            ))}
            {flows.length === 0 && (
              <div className="text-sm text-muted-foreground">
                Chưa có biến động kho.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
