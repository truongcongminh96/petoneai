import { useState, useEffect } from "react";
import { AppLayout } from "./Layout";
import { Dashboard } from "@/features/dashboard/Dashboard";
import { ProductsList } from "@/features/products/ProductsList";
import { runMigrations } from "@/db";

function App() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    runMigrations().then(() => setDbReady(true));
  }, []);

  if (!dbReady) {
    return <div className="flex h-screen items-center justify-center text-muted-foreground">Initializing Database...</div>;
  }

  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return <Dashboard />;
      case "products":
        return <ProductsList />;
      default:
        return <div className="text-muted-foreground">Component for {activeMenu} is under construction.</div>;
    }
  };

  return (
    <AppLayout activeMenu={activeMenu} onMenuChange={setActiveMenu}>
      {renderContent()}
    </AppLayout>
  );
}

export default App;
