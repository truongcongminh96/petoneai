import { useState } from "react";
import { AppLayout } from "./Layout";
import { Dashboard } from "@/features/dashboard/Dashboard";
import { ProductsList } from "@/features/products/ProductsList";
import { isSupabaseConfigured } from "@/db/supabase";

function App() {
  const [activeMenu, setActiveMenu] = useState("dashboard");

  if (!isSupabaseConfigured) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background p-6">
        <div className="max-w-lg rounded-xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Chưa cấu hình Supabase</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tạo file .env.local từ .env.example, sau đó điền
            VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY của project Supabase.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-muted p-3 text-xs">
            VITE_SUPABASE_URL=https://your-project-ref.supabase.co{"\n"}
            VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
          </pre>
        </div>
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
