import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Boxes, Search } from "lucide-react";
import InventoryStatsCards from "@/components/inventory/InventoryStatsCards";
import InventoryTable from "@/components/inventory/InventoryTable";
import StockAdjustDialog from "@/components/inventory/StockAdjustDialog";
import OrderSyncPanel from "@/components/inventory/OrderSyncPanel";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [adjustProduct, setAdjustProduct] = useState(null);
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["inventory-products"],
    queryFn: () => base44.entities.Product.list("-created_date", 500),
  });

  // 주문 출고 등으로 서버 재고가 변경되면 실시간으로 화면 갱신
  useEffect(() => {
    const unsubscribe = base44.entities.Product.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
    });
    return unsubscribe;
  }, [queryClient]);

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.model_number?.toLowerCase().includes(search.toLowerCase());
    const stock = p.stock_quantity || 0;
    const threshold = p.stock_alert_threshold ?? 10;
    const matchFilter =
      filter === "all" ||
      (filter === "low" && stock > 0 && stock <= threshold) ||
      (filter === "out" && stock <= 0) ||
      (filter === "normal" && stock > threshold);
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-1">Inventory Management</p>
        <h1 className="font-serif text-3xl text-foreground flex items-center gap-2">
          <Boxes className="w-7 h-7 text-primary" /> 재고 관리
        </h1>
        <p className="text-sm text-muted-foreground mt-1">주문 접수 시 자동으로 재고가 차감되며, 수동 조정도 가능합니다</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20 text-muted-foreground text-sm">불러오는 중...</div>
      ) : (
        <>
          <InventoryStatsCards products={products} />

          <OrderSyncPanel products={products} />

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="제품명 또는 모델번호 검색"
                className="pl-9"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="normal">정상</SelectItem>
                <SelectItem value="low">부족</SelectItem>
                <SelectItem value="out">품절</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <InventoryTable products={filtered} onAdjust={setAdjustProduct} />
        </>
      )}

      <StockAdjustDialog
        product={adjustProduct}
        open={!!adjustProduct}
        onOpenChange={(o) => { if (!o) setAdjustProduct(null); }}
      />
    </div>
  );
}