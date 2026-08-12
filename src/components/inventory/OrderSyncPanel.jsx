import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import UnmatchedProductRow from "./UnmatchedProductRow";

export default function OrderSyncPanel({ products }) {
  const queryClient = useQueryClient();
  const [applying, setApplying] = useState(false);
  const [linking, setLinking] = useState(false);
  const [message, setMessage] = useState("");

  const { data: check, isFetching, refetch } = useQuery({
    queryKey: ["inventory-order-sync"],
    queryFn: async () => {
      const res = await base44.functions.invoke("syncInventoryFromOrders", { dryRun: true });
      return res.data;
    },
  });

  const pending = check?.pendingOrders || 0;
  const unmatched = check?.unmatched || [];
  const matchedCount = check?.appliedOrders || 0;

  const applySync = async () => {
    setApplying(true);
    setMessage("");
    const res = await base44.functions.invoke("syncInventoryFromOrders", { dryRun: false });
    const total = (res.data?.applied || []).reduce((s, a) => s + a.deducted, 0);
    setMessage(total ? `${total}개 재고가 차감되었습니다` : "반영할 주문이 없습니다");
    queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
    await refetch();
    setApplying(false);
  };

  const linkAlias = async (orderName, productId) => {
    setLinking(true);
    const product = products.find((p) => p.id === productId);
    await base44.entities.ProductAlias.create({
      order_product_name: orderName,
      product_id: productId,
      product_name: product?.name,
      units_per_order: 1,
    });
    await refetch();
    setLinking(false);
  };

  return (
    <Card className="mb-6 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">주문 → 재고 반영</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isFetching
              ? "주문 확인 중..."
              : `출고·배송완료 주문 중 미반영 ${pending}건 (제품 매칭됨 ${matchedCount}건 / 미매칭 ${pending - matchedCount}건)`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-1 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> 다시 확인
          </Button>
          <Button size="sm" onClick={applySync} disabled={applying || matchedCount === 0}>
            {applying ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
            {matchedCount}건 재고 반영
          </Button>
        </div>
      </div>

      {message && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" /> {message}
        </div>
      )}

      {unmatched.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-xs text-amber-700">
            <AlertTriangle className="h-4 w-4" />
            아래 주문 상품명이 등록된 제품과 이름이 달라 재고가 차감되지 않았습니다. 제품을 연결해주세요.
          </div>
          {unmatched.map((item) => (
            <UnmatchedProductRow
              key={item.name}
              item={item}
              products={products}
              onLink={linkAlias}
              isLinking={linking}
            />
          ))}
        </div>
      )}
    </Card>
  );
}