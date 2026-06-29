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
      const payload = {
        status: form.status,
        courier: form.courier || undefined,
        tracking_number: form.tracking_number || undefined,
        quantity: Number(form.quantity) || 1,
      };
      if (form.status === "shipped" && !order.shipped_at) {
        payload.shipped_at = new Date().toISOString();
      }
      // 재고 차감은 출고(shipped) 상태 변경 시 자동으로 처리됩니다.
      await base44.entities.Order.update(order.id, payload);
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
            <p className="text-[11px] text-muted-foreground mt-1">상태를 '출고'로 변경하면 이 수량만큼 재고가 차감됩니다.</p>
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