import { useState, useEffect } from "react";
import { AppLayout } from "./Layout";
import { Dashboard } from "@/features/dashboard/Dashboard";
import { ProductsList } from "@/features/products/ProductsList";
import { runMigrations } from "@/db";
import { seedProducts } from "@/db/seed";

function App() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function init() {
      await runMigrations();
      await seedProducts();
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
