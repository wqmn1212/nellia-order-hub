import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, Truck } from "lucide-react";
import ChannelBadge from "@/components/shared/ChannelBadge";
import StatusBadge from "@/components/shared/StatusBadge";
import TrackingInput from "@/components/shipping/TrackingInput";
import ShippingLabel from "@/components/shipping/ShippingLabel";

export default function Shipping() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => base44.entities.Order.list("-created_date", 500),
    initialData: [],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  // 출고 대상: 신규 + 출고 준비 주문
  const pending = orders.filter((o) => ["new", "preparing"].includes(o.status));

  const handleSaveTracking = (id, data) => {
    return updateMutation.mutateAsync({ id, data: { ...data, status: "preparing" } });
  };

  const toggleSelect = (id) =>
    setSelected(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  const toggleAll = () =>
    setSelected(selected.length === pending.length ? [] : pending.map((o) => o.id));

  const selectedOrders = orders.filter((o) => selected.includes(o.id));

  const handlePrint = () => {
    setShowPreview(true);
    setTimeout(() => window.print(), 300);
  };

  const markShipped = async () => {
    await Promise.all(
      selected.map((id) =>
        updateMutation.mutateAsync({ id, data: { status: "shipped", shipped_at: new Date().toISOString() } })
      )
    );
    setSelected([]);
  };

  return (
    <>
      {/* Print area (hidden by default, shown on print) */}
      {showPreview && (
        <div className="print-area hidden print:block">
          <div className="grid grid-cols-2 gap-4 p-4">
            {selectedOrders.map((order) => (
              <ShippingLabel key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      <div className="no-print px-6 md:px-10 py-8 md:py-12 max-w-[1600px] mx-auto">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Shipping</p>
            <h1 className="font-serif text-4xl text-foreground tracking-tight">송장 출력</h1>
            <p className="text-muted-foreground mt-2">
              출고 대상 {pending.length}건 · 택배사와 송장번호를 입력한 뒤 출력하세요
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={selected.length === 0}
              onClick={markShipped}
              className="h-11"
            >
              <Truck className="w-4 h-4 mr-2" />
              출고 완료 ({selected.length})
            </Button>
            <Button
              disabled={selected.length === 0}
              onClick={handlePrint}
              className="h-11 bg-primary hover:bg-primary/90"
            >
              <Printer className="w-4 h-4 mr-2" />
              송장 출력 ({selected.length})
            </Button>
          </div>
        </div>

        {/* Preview */}
        {selected.length > 0 && (
          <Card className="p-6 mb-6 border-primary/30 bg-primary/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg">출력 미리보기</h3>
              <span className="text-xs text-muted-foreground">A4 기준 2열로 출력됩니다</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {selectedOrders.map((order) => (
                <ShippingLabel key={order.id} order={order} />
              ))}
            </div>
          </Card>
        )}

        {/* Pending list */}
        <Card className="border-border/70 shadow-sm overflow-hidden">
          {pending.length === 0 ? (
            <div className="p-16 text-center">
              <Truck className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="font-serif text-lg text-foreground">출고 대기 주문이 없습니다</p>
              <p className="text-sm text-muted-foreground mt-1">새 주문이 들어오면 여기에 표시됩니다</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              <div className="flex items-center gap-3 px-5 py-3 bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                <Checkbox
                  checked={selected.length === pending.length && pending.length > 0}
                  onCheckedChange={toggleAll}
                />
                <span className="flex-1">주문</span>
                <span className="w-96">송장 정보</span>
              </div>
              {pending.map((order) => (
                <div key={order.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors">
                  <Checkbox
                    checked={selected.includes(order.id)}
                    onCheckedChange={() => toggleSelect(order.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <ChannelBadge channel={order.channel} />
                      <StatusBadge status={order.status} />
                      <span className="text-xs text-muted-foreground font-mono">{order.order_number}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {order.customer_name} · {order.product_name}
                      {order.quantity > 1 && <span className="text-muted-foreground"> ×{order.quantity}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {order.customer_zipcode && `[${order.customer_zipcode}] `}
                      {order.customer_address}
                    </p>
                  </div>
                  <div className="w-96">
                    <TrackingInput order={order} onSave={handleSaveTracking} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}