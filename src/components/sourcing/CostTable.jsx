import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Factory, Plus, Pencil, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import CostRow from "@/components/sourcing/CostRow";

const FIXED_LEFT = [
  { label: "제품명 / 품번", sticky: true },
  { label: "수량" },
  { label: "제품제공" },
  { label: "공장단가($)" },
  { label: "선금($)" },
  { label: "선금환율" },
  { label: "잔금($)" },
  { label: "잔금환율" },
  { label: "물류비($/¥)" },
  { label: "관세(₩)" },
  { label: "부가세(₩)" },
  { label: "용달비(₩)" },
  { label: "샘플비(₩)" },
];

export default function CostTable({ projects, isLoading, onDetail }) {
  const queryClient = useQueryClient();
  const [showAddCol, setShowAddCol] = useState(false);
  const [newCol, setNewCol] = useState("");
  const [editingCol, setEditingCol] = useState(null); // label being edited
  const [editVal, setEditVal] = useState("");

  const [extraCols, setExtraCols] = useState(() => {
    const set = new Set();
    (projects || []).forEach((p) =>
      (p.extra_costs || []).forEach((e) => e.label && set.add(e.label))
    );
    return Array.from(set);
  });

  useMemo(() => {
    setExtraCols((prev) => {
      const set = new Set(prev);
      (projects || []).forEach((p) =>
        (p.extra_costs || []).forEach((e) => e.label && set.add(e.label))
      );
      return Array.from(set);
    });
  }, [projects]);

  // 열 이름 변경: 모든 프로젝트의 해당 label 동기화
  const renameCol = useMutation({
    mutationFn: async ({ from, to }) => {
      const affected = (projects || []).filter((p) =>
        (p.extra_costs || []).some((e) => e.label === from)
      );
      await Promise.all(affected.map((p) =>
        base44.entities.SourcingProject.update(p.id, {
          extra_costs: (p.extra_costs || []).map((e) =>
            e.label === from ? { ...e, label: to } : e
          ),
        })
      ));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sourcing"] }),
  });

  // 열 삭제: 모든 프로젝트의 해당 항목 제거
  const deleteCol = useMutation({
    mutationFn: async (label) => {
      const affected = (projects || []).filter((p) =>
        (p.extra_costs || []).some((e) => e.label === label)
      );
      await Promise.all(affected.map((p) =>
        base44.entities.SourcingProject.update(p.id, {
          extra_costs: (p.extra_costs || []).filter((e) => e.label !== label),
        })
      ));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sourcing"] }),
  });

  const addCol = () => {
    const name = newCol.trim();
    if (!name || extraCols.includes(name)) { setShowAddCol(false); setNewCol(""); return; }
    setExtraCols((p) => [...p, name]);
    setShowAddCol(false);
    setNewCol("");
  };

  const startEdit = (label) => { setEditingCol(label); setEditVal(label); };
  const confirmEdit = () => {
    const to = editVal.trim();
    if (to && to !== editingCol && !extraCols.includes(to)) {
      setExtraCols((cols) => cols.map((c) => (c === editingCol ? to : c)));
      renameCol.mutate({ from: editingCol, to });
    }
    setEditingCol(null);
  };
  const removeCol = (label) => {
    setExtraCols((cols) => cols.filter((c) => c !== label));
    deleteCol.mutate(label);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (projects.length === 0) {
    return (
      <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center">
        <Factory className="w-9 h-9 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">소싱 프로젝트를 추가해보세요</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-secondary/60 border-b border-border">
              {FIXED_LEFT.map((col, i) => (
                <th key={i}
                  className={`px-2 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap border-r border-border/60 ${
                    col.sticky ? "sticky left-0 bg-secondary z-10" : ""
                  }`}>
                  {col.label}
                </th>
              ))}
              {extraCols.map((label) => (
                <th key={label}
                  className="px-2 py-2.5 text-left font-semibold text-primary whitespace-nowrap border-r border-border/60 bg-accent/40">
                  {editingCol === label ? (
                    <div className="flex items-center gap-1">
                      <input autoFocus value={editVal} onChange={(e) => setEditVal(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") confirmEdit(); if (e.key === "Escape") setEditingCol(null); }}
                        className="w-24 h-7 px-1.5 text-xs rounded border border-input bg-card focus:outline-none focus:ring-1 focus:ring-ring" />
                      <button onClick={confirmEdit} className="text-green-600 hover:text-green-700"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditingCol(null)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group">
                      <span>{label}</span>
                      <button onClick={() => startEdit(label)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary" title="이름 수정">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeCol(label)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" title="열 삭제">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </th>
              ))}
              <th className="px-1 py-2.5 border-r border-border/60 bg-accent/40">
                <button
                  onClick={() => setShowAddCol(true)}
                  className="flex items-center justify-center w-7 h-7 rounded-md border border-dashed border-primary/50 text-primary hover:bg-primary/10"
                  title="추가비용 열 추가">
                  <Plus className="w-4 h-4" />
                </button>
              </th>
              <th className="px-2 py-2.5 text-right font-semibold text-primary whitespace-nowrap border-r border-border/60">개당 수입원가(₩)</th>
              <th className="px-2 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap border-r border-border/60">입항(ETA)</th>
              <th className="px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <CostRow key={p.id} project={p} extraCols={extraCols} onDetail={onDetail} />
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showAddCol} onOpenChange={setShowAddCol}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>추가비용 열 추가</DialogTitle></DialogHeader>
          <div className="py-2">
            <Input
              autoFocus
              value={newCol}
              onChange={(e) => setNewCol(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCol()}
              placeholder="열 이름 (예: KC인증비, 검사비)"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCol(false)}>취소</Button>
            <Button onClick={addCol} disabled={!newCol.trim()}>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}