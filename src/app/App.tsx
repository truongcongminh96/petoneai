import { useEffect, useState } from "react";
import { AppLayout } from "./Layout";
import { Dashboard } from "@/features/dashboard/Dashboard";
import { Receiving } from "@/features/inventory/Receiving";
import { StockMovements } from "@/features/inventory/StockMovements";
import { ProductsList } from "@/features/products/ProductsList";
import { Reports } from "@/features/reports/Reports";
import { Settings } from "@/features/settings/Settings";
import { runMigrations } from "@/db";
import { seedProducts } from "@/db/seed";

function App() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function init() {
      if (import.meta.env.VITE_E2E !== "1") {
        await runMigrations();
        try {
          await seedProducts();
        } catch (error) {
          console.error("Demo seed failed:", error);
        }
      }
      setDbReady(true);
    }
    init();
  }, []);

  if (!dbReady) {
    return (
      <div className="flex h-dvh items-center justify-center text-muted-foreground">
        Đang khởi tạo dữ liệu...
      </div>
    );
  }

  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return <Dashboard />;
      case "products":
        return <ProductsList />;
      case "receiving":
        return <Receiving />;
      case "stock":
        return <StockMovements />;
      case "reports":
        return <Reports />;
      case "settings":
        return <Settings />;
      default:
        return (
          <div className="text-muted-foreground">
            Chức năng này đang được phát triển.
          </div>
        );
    }
  };

  return (
    <AppLayout activeMenu={activeMenu} onMenuChange={setActiveMenu}>
      {renderContent()}
    </AppLayout>
  );
}

export default App;
