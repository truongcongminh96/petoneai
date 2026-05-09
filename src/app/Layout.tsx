import { ReactNode } from "react";
import { LayoutDashboard, Package, ShoppingCart, Settings, ReceiptText } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  activeMenu: string;
  onMenuChange: (menu: string) => void;
}

export function AppLayout({ children, activeMenu, onMenuChange }: LayoutProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { id: "products", label: "Products", icon: <Package size={20} /> },
    { id: "sales", label: "Sales", icon: <ShoppingCart size={20} /> },
    { id: "expenses", label: "Expenses", icon: <ReceiptText size={20} /> },
    { id: "settings", label: "Settings", icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border font-bold text-lg text-primary flex items-center gap-2">
          <span>🐾 PetOne AI</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onMenuChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                activeMenu === item.id ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted text-muted-foreground"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-14 border-b border-border bg-card flex items-center px-6">
          <h2 className="font-semibold text-lg capitalize">{activeMenu}</h2>
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-muted/20">
          {children}
        </div>
      </main>
    </div>
  );
}
