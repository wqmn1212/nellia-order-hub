import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Truck } from "lucide-react";
import { STATUSES, COURIERS } from "@/components/shared/constants";

export default function ShippingEditDialog({ order, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ status: "new", courier: "", tracking_number: "", quantity: 1 });

  useEffect(() => {
    if (order) {
      setForm({
        status: order.status || "new",
        courier: order.courier || "",
        tracking_number: order.tracking_number || "",
        quantity: order.quantity || 1,
      });
    }
  }, [order]);

  const save = useMutation({
    mutationFn: async () => {
      const newQty = Number(form.quantity) || 1;
      const oldQty = order.quantity || 1;
      const payload = {
        status: form.status,
        courier: form.courier || undefined,
        tracking_number: form.tracking_number || undefined,
        quantity: newQty,
      };
      if (form.status === "shipped" && !order.shipped_at) {
        payload.shipped_at = new Date().toISOString();
      }
      await base44.entities.Order.update(order.id, payload);

      // 수량이 변경되면 그 차이만큼 재고에 반영 (출고 수량 변동 처리)
      const diff = newQty - oldQty;
      if (diff !== 0 && order.product_name) {
        const products = await base44.entities.Product.filter({ name: order.product_name });
        if (products.length > 0) {
          const product = products[0];
          const current = product.stock_quantity || 0;
          const newStock = Math.max(0, current - diff);
          await base44.entities.Product.update(product.id, { stock_quantity: newStock });
          await base44.entities.InventoryLog.create({
            product_id: product.id,
            product_name: product.name,
            quantity_change: -diff,
            reason: "sale_out",
            reason_detail: `발송 수량 변경 (${order.order_number || order.id}): ${oldQty}→${newQty}개`,
            handler: "수동 입력",
            order_id: order.id,
            stock_after: newStock,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onOpenChange(false);
    },
  });

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" /> 발송 정보 수정
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium">{order.product_name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{order.customer_name} · {order.order_number || "주문번호 없음"}</p>
          </div>

          <div>
            <Label className="text-xs">주문 상태</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUSES).map(([k, s]) => <SelectItem key={k} value={k}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">발송 수량</Label>
            <Input
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="mt-1"
            />
            <p className="text-[11px] text-muted-foreground mt-1">수량을 변경하면 차이만큼 재고에 자동 반영됩니다.</p>
          </div>

          <div>
            <Label className="text-xs">택배사</Label>
            <Select value={form.courier} onValueChange={(v) => setForm({ ...form, courier: v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="선택" /></SelectTrigger>
              <SelectContent>
                {Object.entries(COURIERS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">송장 번호</Label>
            <Input
              value={form.tracking_number}
              onChange={(e) => setForm({ ...form, tracking_number: e.target.value })}
              placeholder="송장 번호 입력"
              className="mt-1"
            />
          </div>

          <Button className="w-full" disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? "저장 중..." : "저장"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}