import type { ReactNode } from "react";
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Package,
  PackagePlus,
  Settings,
  ShoppingCart,
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  activeMenu: string;
  onMenuChange: (menu: string) => void;
}

export function AppLayout({ children, activeMenu, onMenuChange }: LayoutProps) {
  const menuItems = [
    { id: "dashboard", label: "Tổng quan", icon: <LayoutDashboard size={20} /> },
    { id: "products", label: "Sản phẩm", icon: <Package size={20} /> },
    { id: "receiving", label: "Nhập hàng", icon: <PackagePlus size={20} /> },
    { id: "stock", label: "Lịch sử kho", icon: <ClipboardList size={20} /> },
    { id: "sales", label: "Bán hàng", icon: <ShoppingCart size={20} /> },
    { id: "reports", label: "Báo cáo", icon: <BarChart3 size={20} /> },
    { id: "settings", label: "Cài đặt", icon: <Settings size={20} /> },
  ];
  const activeLabel =
    menuItems.find((item) => item.id === activeMenu)?.label ?? activeMenu;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground md:flex-row">
      <aside className="order-last flex shrink-0 border-t border-border bg-card md:order-first md:h-dvh md:w-64 md:flex-col md:border-r md:border-t-0">
        <div className="hidden border-b border-border p-4 text-lg font-bold text-primary md:flex md:items-center md:gap-2">
          <span>🐾 PetOne AI</span>
        </div>
        <nav className="flex w-full gap-1 overflow-x-auto p-2 md:flex-1 md:flex-col md:space-y-1 md:overflow-y-auto md:p-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onMenuChange(item.id)}
              className={`flex min-w-16 flex-1 flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-xs transition-colors md:w-full md:min-w-0 md:flex-none md:flex-row md:justify-start md:gap-3 md:px-3 md:text-base ${
                activeMenu === item.id
                  ? "bg-primary text-primary-foreground font-medium"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="order-first flex min-h-0 flex-1 flex-col overflow-hidden md:order-last">
        <header className="flex h-14 shrink-0 items-center border-b border-border bg-card px-4 md:px-6">
          <h2 className="font-semibold text-lg">{activeLabel}</h2>
        </header>
        <div className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
