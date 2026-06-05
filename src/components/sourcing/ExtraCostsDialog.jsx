import React, { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

const SYMBOL = { KRW: "₩", USD: "$", RMB: "¥" };

function toKrw(r) {
  const amt = Number(r.amount) || 0;
  if (r.currency === "KRW") return amt;
  return amt * (Number(r.exchange_rate) || 0);
}

export default function ExtraCostsDialog({ project, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState(() =>
    (project.extra_costs || []).map((c) => ({
      label: c.label || "",
      currency: c.currency || "KRW",
      amount: c.amount ?? "",
      exchange_rate: c.exchange_rate ?? "",
      date: c.date || "",
    }))
  );

  const total = useMemo(() => rows.reduce((s, r) => s + toKrw(r), 0), [rows]);

  const addRow = () => setRows((p) => [...p, { label: "", currency: "KRW", amount: "", exchange_rate: "", date: "" }]);
  const removeRow = (i) => setRows((p) => p.filter((_, idx) => idx !== i));
  const update = (i, key, val) =>
    setRows((p) => p.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));

  const save = useMutation({
    mutationFn: () =>
      base44.entities.SourcingProject.update(project.id, {
        extra_costs: rows
          .filter((r) => r.label.trim())
          .map((r) => ({
            label: r.label.trim(),
            currency: r.currency,
            amount: Number(r.amount) || 0,
            exchange_rate: r.currency === "KRW" ? 1 : (Number(r.exchange_rate) || 0),
            date: r.date || undefined,
            amount_krw: Math.round(toKrw(r)),
          })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sourcing"] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>추가 비용 항목 (KC인증비 등)</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2 max-h-[55vh] overflow-y-auto">
          {rows.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              아래 ‘항목 추가’로 KC인증비, 검사비 등을 자유롭게 추가하세요. 통화·환율·날짜를 입력하면 KRW로 자동 환산됩니다.
            </p>
          )}
          {rows.map((r, i) => {
            const isKrw = r.currency === "KRW";
            return (
              <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={r.label}
                    onChange={(e) => update(i, "label", e.target.value)}
                    placeholder="항목명 (예: KC인증비용)"
                    className="flex-1 h-9 text-sm"
                  />
                  <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeRow(i)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Select value={r.currency} onValueChange={(v) => update(i, "currency", v)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KRW">₩ 원 (KRW)</SelectItem>
                      <SelectItem value="USD">$ 달러 (USD)</SelectItem>
                      <SelectItem value="RMB">¥ 위안 (RMB)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={r.amount}
                    onChange={(e) => update(i, "amount", e.target.value)}
                    placeholder={`${SYMBOL[r.currency]} 금액`}
                    className="h-9 text-sm"
                  />
                  <Input
                    type="number"
                    value={isKrw ? "" : r.exchange_rate}
                    onChange={(e) => update(i, "exchange_rate", e.target.value)}
                    placeholder="환율"
                    disabled={isKrw}
                    className="h-9 text-sm"
                  />
                  <Input
                    type="date"
                    value={r.date}
                    onChange={(e) => update(i, "date", e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                {!isKrw && (
                  <div className="text-[11px] text-muted-foreground text-right">
                    KRW 환산: ₩{Math.round(toKrw(r)).toLocaleString()}
                  </div>
                )}
              </div>
            );
          })}
          <Button variant="outline" size="sm" className="w-full gap-1.5 mt-1" onClick={addRow}>
            <Plus className="w-4 h-4" /> 항목 추가
          </Button>
        </div>
        <div className="p-3 rounded-lg bg-secondary/50 border border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">추가 비용 합계 (KRW 환산)</span>
          <span className="text-base font-bold text-primary tabular-nums">₩{Math.round(total).toLocaleString()}</span>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}