import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useProductsStore } from "./store";

export function ProductFilters() {
  const search = useProductsStore((s) => s.search);
  const setSearch = useProductsStore((s) => s.setSearch);
  const categoryFilter = useProductsStore((s) => s.categoryFilter);
  const setCategoryFilter = useProductsStore((s) => s.setCategoryFilter);
  const categories = useProductsStore((s) => s.categories);

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {/* Search */}
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Tìm theo tên, SKU hoặc mã vạch..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category filter */}
      <Select
        value={categoryFilter?.toString() ?? "all"}
        onValueChange={(v) =>
          setCategoryFilter(v === "all" ? null : Number(v))
        }
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Tất cả danh mục" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả danh mục</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id.toString()}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
