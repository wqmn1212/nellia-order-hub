import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { History, Plus, ArrowDownCircle, ArrowUpCircle, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

const REASON_LABELS = {
  sale_out: { label: "판매 출고", color: "bg-red-100 text-red-700", icon: "📦" },
  return_in: { label: "반품 입고", color: "bg-blue-100 text-blue-700", icon: "↩️" },
  defect_discard: { label: "불량 폐기", color: "bg-orange-100 text-orange-700", icon: "🗑️" },
  manual_adjust: { label: "수동 조정", color: "bg-purple-100 text-purple-700", icon: "✏️" },
  initial_stock: { label: "초기 재고", color: "bg-green-100 text-green-700", icon: "📋" },
  other: { label: "기타", color: "bg-slate-100 text-slate-700", icon: "📝" },
};

export default function InventoryHistory({ product }) {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ quantity_change: "", reason: "manual_adjust", reason_detail: "" });
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["inventory-logs", product.id],
    queryFn: () => base44.entities.InventoryLog.filter({ product_id: product.id }, "-created_date", 50),
    enabled: open,
  });

  const addLog = useMutation({
    mutationFn: async (data) => {
      const qty = Number(data.quantity_change);
      const newStock = Math.max(0, (product.stock_quantity || 0) + qty);
      await base44.entities.Product.update(product.id, { stock_quantity: newStock });
      return base44.entities.InventoryLog.create({
        product_id: product.id,
        product_name: product.name,
        quantity_change: qty,
        reason: data.reason,
        reason_detail: data.reason_detail,
        handler: "수동 입력",
        stock_after: newStock,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-logs", product.id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowForm(false);
      setForm({ quantity_change: "", reason: "manual_adjust", reason_detail: "" });
    },
  });

  return (
    <>
      <Button variant="ghost" size="sm" className="w-full gap-1.5 text-xs text-muted-foreground" onClick={() => setOpen(true)}>
        <History className="w-3.5 h-3.5" /> 재고 변동 이력
        <Badge variant="outline" className="text-[10px] ml-1">{product.stock_quantity ?? 0}개</Badge>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              {product.name} — 재고 이력
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between mb-3">
            <div className="text-sm">
              현재 재고: <span className="font-bold text-primary">{product.stock_quantity ?? 0}개</span>
            </div>
            <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setShowForm(!showForm)}>
              <Plus className="w-3 h-3" /> 수동 조정
            </Button>
          </div>

          {showForm && (
            <div className="bg-muted/50 rounded-lg p-3 mb-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">변동 수량 (입고: +, 출고: -)</Label>
                  <Input
                    type="number"
                    value={form.quantity_change}
                    onChange={(e) => setForm({ ...form, quantity_change: e.target.value })}
                    placeholder="예: 10 또는 -3"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">사유</Label>
                  <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(REASON_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.icon} {v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">메모</Label>
                <Input value={form.reason_detail} onChange={(e) => setForm({ ...form, reason_detail: e.target.value })} placeholder="상세 사유" className="mt-1" />
              </div>
              <Button size="sm" className="w-full" onClick={() => addLog.mutate(form)} disabled={!form.quantity_change || addLog.isPending}>
                기록 저장
              </Button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-1.5">
            {isLoading ? (
              <p className="text-center text-sm text-muted-foreground py-6">불러오는 중...</p>
            ) : logs.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">재고 변동 이력이 없습니다</p>
            ) : (
              logs.map((log) => {
                const r = REASON_LABELS[log.reason] || REASON_LABELS.other;
                const isPositive = log.quantity_change > 0;
                return (
                  <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/30 border border-transparent hover:border-border transition-colors">
                    <div className="mt-0.5">
                      {isPositive ? (
                        <ArrowUpCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${isPositive ? "text-green-700" : "text-red-700"}`}>
                          {isPositive ? "+" : ""}{log.quantity_change}개
                        </span>
                        <Badge className={`text-[10px] px-1.5 py-0 ${r.color}`}>{r.label}</Badge>
                        {log.stock_after != null && (
                          <span className="text-[10px] text-muted-foreground">→ 잔여 {log.stock_after}개</span>
                        )}
                      </div>
                      {log.reason_detail && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{log.reason_detail}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {log.handler} · {formatDistanceToNow(new Date(log.created_date), { addSuffix: true, locale: ko })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}