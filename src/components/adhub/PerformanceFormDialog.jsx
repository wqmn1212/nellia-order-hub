import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PLATFORMS } from "./adConstants";

const today = () => new Date().toISOString().slice(0, 10);
const EMPTY = { date: today(), platform: "meta", campaign_name: "", spend_krw: 0, impressions: 0, clicks: 0, conversions: 0, conversion_value_krw: 0 };

const NUM_FIELDS = [
  { k: "spend_krw", label: "지출 (₩)" },
  { k: "impressions", label: "노출수" },
  { k: "clicks", label: "클릭수" },
  { k: "conversions", label: "전환수" },
  { k: "conversion_value_krw", label: "전환 매출 (₩)" },
];

export default function PerformanceFormDialog({ open, onOpenChange, row }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) setForm(row ? { ...EMPTY, ...row } : EMPTY);
  }, [open, row]);

  const save = useMutation({
    mutationFn: (data) =>
      row
        ? base44.entities.AdPerformance.update(row.id, data)
        : base44.entities.AdPerformance.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adPerformance"] });
      onOpenChange(false);
    },
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{row ? "성과 데이터 수정" : "성과 데이터 추가"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">일자</Label>
            <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">매체</Label>
            <Select value={form.platform} onValueChange={(v) => set("platform", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => <SelectItem key={p.key} value={p.key}>{p.emoji} {p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">캠페인 이름</Label>
            <Input value={form.campaign_name || ""} onChange={(e) => set("campaign_name", e.target.value)} />
          </div>
          {NUM_FIELDS.map((f) => (
            <div key={f.k}>
              <Label className="text-xs">{f.label}</Label>
              <Input type="number" value={form[f.k]} onChange={(e) => set(f.k, Number(e.target.value))} />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={() => save.mutate(form)} disabled={save.isPending}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}