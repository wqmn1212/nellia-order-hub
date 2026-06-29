import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const REASONS = {
  manual_adjust: "✏️ 수동 조정",
  initial_stock: "📋 초기 재고",
  return_in: "↩️ 반품 입고",
  defect_discard: "🗑️ 불량 폐기",
  other: "📝 기타",
};

export default function StockAdjustDialog({ product, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState("delta"); // delta | set
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("manual_adjust");
  const [detail, setDetail] = useState("");

  const adjust = useMutation({
    mutationFn: async () => {
      const current = product.stock_quantity || 0;
      const num = Number(value);
      const change = mode === "set" ? num - current : num;
      const newStock = Math.max(0, current + change);
      await base44.entities.Product.update(product.id, { stock_quantity: newStock });
      return base44.entities.InventoryLog.create({
        product_id: product.id,
        product_name: product.name,
        quantity_change: change,
        reason,
        reason_detail: detail || (mode === "set" ? `재고 ${num}개로 설정` : ""),
        handler: "수동 입력",
        stock_after: newStock,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      reset();
      onOpenChange(false);
    },
  });

  const reset = () => { setValue(""); setReason("manual_adjust"); setDetail(""); setMode("delta"); };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{product.name} — 재고 조정</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm">현재 재고: <span className="font-bold text-primary">{product.stock_quantity ?? 0}개</span></p>

          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={mode === "delta" ? "default" : "outline"} size="sm" onClick={() => setMode("delta")}>증감 (+/-)</Button>
            <Button type="button" variant={mode === "set" ? "default" : "outline"} size="sm" onClick={() => setMode("set")}>실재고 설정</Button>
          </div>

          <div>
            <Label className="text-xs">{mode === "set" ? "실제 재고 수량" : "변동 수량 (입고: +, 출고: -)"}</Label>
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={mode === "set" ? "예: 1008" : "예: 50 또는 -10"}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">사유</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(REASONS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">메모</Label>
            <Input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="상세 사유" className="mt-1" />
          </div>

          <Button className="w-full" disabled={value === "" || adjust.isPending} onClick={() => adjust.mutate()}>
            {adjust.isPending ? "저장 중..." : "저장"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}