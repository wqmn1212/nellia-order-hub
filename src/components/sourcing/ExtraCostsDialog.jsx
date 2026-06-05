import React, { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

export default function ExtraCostsDialog({ project, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState(() =>
    (project.extra_costs || []).map((c) => ({ label: c.label || "", amount_krw: c.amount_krw ?? "" }))
  );

  const total = useMemo(
    () => rows.reduce((s, r) => s + (Number(r.amount_krw) || 0), 0),
    [rows]
  );

  const addRow = () => setRows((p) => [...p, { label: "", amount_krw: "" }]);
  const removeRow = (i) => setRows((p) => p.filter((_, idx) => idx !== i));
  const update = (i, key, val) =>
    setRows((p) => p.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));

  const save = useMutation({
    mutationFn: () =>
      base44.entities.SourcingProject.update(project.id, {
        extra_costs: rows
          .filter((r) => r.label.trim())
          .map((r) => ({ label: r.label.trim(), amount_krw: Number(r.amount_krw) || 0 })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sourcing"] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>추가 비용 항목 (KC인증비 등)</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2 max-h-[50vh] overflow-y-auto">
          {rows.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              아래 ‘항목 추가’로 KC인증비, 검사비 등을 자유롭게 추가하세요
            </p>
          )}
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={r.label}
                onChange={(e) => update(i, "label", e.target.value)}
                placeholder="항목명 (예: KC인증비용)"
                className="flex-1 h-9 text-sm"
              />
              <Input
                type="number"
                value={r.amount_krw}
                onChange={(e) => update(i, "amount_krw", e.target.value)}
                placeholder="₩ 금액"
                className="w-32 h-9 text-sm"
              />
              <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeRow(i)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full gap-1.5 mt-1" onClick={addRow}>
            <Plus className="w-4 h-4" /> 항목 추가
          </Button>
        </div>
        <div className="p-3 rounded-lg bg-secondary/50 border border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">추가 비용 합계 (KRW)</span>
          <span className="text-base font-bold text-primary tabular-nums">₩{total.toLocaleString()}</span>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}