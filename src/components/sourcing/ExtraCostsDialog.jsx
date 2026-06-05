import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

const CURRENCIES = ["KRW", "USD", "RMB"];

function toKrw(row) {
  const amt = Number(row.amount) || 0;
  if (row.currency === "KRW") return amt;
  return Math.round(amt * (Number(row.exchange_rate) || 0));
}

export default function ExtraCostsDialog({ project, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState(() =>
    (project.extra_costs || []).map((e) => ({
      label: e.label || "",
      currency: e.currency || "KRW",
      amount: e.amount ?? "",
      exchange_rate: e.exchange_rate ?? "",
      date: e.date || "",
    }))
  );

  const update = (i, key, val) =>
    setRows((p) => p.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));

  const addRow = () =>
    setRows((p) => [...p, { label: "", currency: "KRW", amount: "", exchange_rate: "", date: "" }]);

  const removeRow = (i) => setRows((p) => p.filter((_, idx) => idx !== i));

  const total = rows.reduce((s, r) => s + toKrw(r), 0);

  const save = useMutation({
    mutationFn: () => {
      const extra_costs = rows
        .filter((r) => r.label.trim())
        .map((r) => ({
          label: r.label.trim(),
          currency: r.currency,
          amount: Number(r.amount) || 0,
          exchange_rate: r.currency === "KRW" ? 1 : Number(r.exchange_rate) || 0,
          date: r.date || undefined,
          amount_krw: toKrw(r),
        }));
      return base44.entities.SourcingProject.update(project.id, { extra_costs });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sourcing"] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>추가비용 관리 — {project.product_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 pt-2">
          <div className="grid grid-cols-[1fr_80px_90px_90px_120px_32px] gap-2 px-1 text-[11px] font-semibold text-muted-foreground">
            <span>항목명</span><span>통화</span><span>금액</span><span>환율</span><span>기준일</span><span />
          </div>

          {rows.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">+ 버튼으로 추가비용 항목을 추가하세요</p>
          )}

          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_90px_90px_120px_32px] gap-2 items-center">
              <Input value={r.label} onChange={(e) => update(i, "label", e.target.value)} placeholder="예: KC인증비" className="h-9" />
              <Select value={r.currency} onValueChange={(v) => update(i, "currency", v)}>
                <SelectTrigger className="h-9 px-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" value={r.amount} onChange={(e) => update(i, "amount", e.target.value)} placeholder="0" className="h-9" />
              <Input type="number" value={r.currency === "KRW" ? "" : r.exchange_rate}
                onChange={(e) => update(i, "exchange_rate", e.target.value)}
                placeholder={r.currency === "KRW" ? "-" : "환율"} disabled={r.currency === "KRW"} className="h-9" />
              <Input type="date" value={r.date} onChange={(e) => update(i, "date", e.target.value)} className="h-9" />
              <Button size="icon" variant="ghost" className="h-9 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeRow(i)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <Button variant="outline" size="sm" className="gap-1.5 mt-1" onClick={addRow}>
            <Plus className="w-4 h-4" /> 항목 추가
          </Button>

          <div className="flex justify-end items-center gap-2 pt-3 border-t border-border mt-3">
            <span className="text-sm text-muted-foreground">합계(KRW)</span>
            <span className="text-base font-bold text-primary tabular-nums">₩{total.toLocaleString()}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}