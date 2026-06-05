import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus } from "lucide-react";
import { PLATFORM_MAP, won } from "./adConstants";
import PerformanceFormDialog from "./PerformanceFormDialog";

export default function PerformanceTable({ rows }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const del = useMutation({
    mutationFn: (id) => base44.entities.AdPerformance.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adPerformance"] }),
  });

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (r) => { setEditing(r); setOpen(true); };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold">일자별 성과 데이터</h3>
          <p className="text-xs text-muted-foreground mt-0.5">직접 추가·수정·삭제할 수 있습니다</p>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> 데이터 추가</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border">
              <th className="text-left py-2 px-2 font-medium">일자</th>
              <th className="text-left py-2 px-2 font-medium">매체</th>
              <th className="text-left py-2 px-2 font-medium">캠페인</th>
              <th className="text-right py-2 px-2 font-medium">지출</th>
              <th className="text-right py-2 px-2 font-medium">클릭</th>
              <th className="text-right py-2 px-2 font-medium">전환</th>
              <th className="text-right py-2 px-2 font-medium">매출</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">데이터가 없습니다</td></tr>
            )}
            {rows.map((r) => {
              const p = PLATFORM_MAP[r.platform];
              return (
                <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="py-2 px-2 whitespace-nowrap">{r.date}</td>
                  <td className="py-2 px-2 whitespace-nowrap">{p?.emoji} {p?.label}</td>
                  <td className="py-2 px-2 max-w-[160px] truncate">{r.campaign_name || "-"}</td>
                  <td className="py-2 px-2 text-right">{won(r.spend_krw)}</td>
                  <td className="py-2 px-2 text-right">{(r.clicks || 0).toLocaleString()}</td>
                  <td className="py-2 px-2 text-right">{(r.conversions || 0).toLocaleString()}</td>
                  <td className="py-2 px-2 text-right">{won(r.conversion_value_krw)}</td>
                  <td className="py-2 px-2">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("삭제하시겠습니까?")) del.mutate(r.id); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <PerformanceFormDialog open={open} onOpenChange={setOpen} row={editing} />
    </Card>
  );
}