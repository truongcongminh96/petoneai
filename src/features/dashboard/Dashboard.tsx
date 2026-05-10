import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";

export function Dashboard() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,345</div>
            <p className="text-xs text-green-500 flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +15% so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tồn kho</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">248</div>
            <p className="text-xs text-muted-foreground mt-1">
              12 sản phẩm sắp hết hàng
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng chi phí</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$3,120</div>
            <p className="text-xs text-red-500 flex items-center mt-1">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              -2% so với tháng trước
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hoạt động gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Chưa có hoạt động gần đây. Kết nối dữ liệu để xem thông tin mới nhất.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
