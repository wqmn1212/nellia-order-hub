import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdCampaignDialog({ project, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [depositDate, setDepositDate] = useState(project.deposit_date || "");
  const [balanceDate, setBalanceDate] = useState(project.balance_date || "");
  const [campaigns, setCampaigns] = useState(project.ad_campaigns || []);

  const addCampaign = () => setCampaigns((c) => [...c, { medium: "", amount_krw: "", start_date: "", end_date: "" }]);
  const updateCampaign = (i, patch) => setCampaigns((c) => c.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const removeCampaign = (i) => setCampaigns((c) => c.filter((_, idx) => idx !== i));

  const save = useMutation({
    mutationFn: () => base44.entities.SourcingProject.update(project.id, {
      deposit_date: depositDate || undefined,
      balance_date: balanceDate || undefined,
      ad_campaigns: campaigns.map((c) => ({
        medium: c.medium || "",
        amount_krw: Number(c.amount_krw) || 0,
        start_date: c.start_date || undefined,
        end_date: c.end_date || undefined,
      })),
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sourcing"] }); onOpenChange(false); },
  });

  const adTotal = campaigns.reduce((s, a) => s + (Number(a.amount_krw) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{project.product_name} · 송금일정 &amp; 광고비</DialogTitle></DialogHeader>
        <div className="space-y-5 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>선금 송금일</Label>
              <Input type="date" className="mt-1.5" value={depositDate} onChange={(e) => setDepositDate(e.target.value)} />
            </div>
            <div>
              <Label>잔금 송금일</Label>
              <Input type="date" className="mt-1.5" value={balanceDate} onChange={(e) => setBalanceDate(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>광고 캠페인 (매체 · 금액 · 기간)</Label>
              <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={addCampaign}>
                <Plus className="w-3.5 h-3.5" /> 캠페인 추가
              </Button>
            </div>
            <div className="space-y-2">
              {campaigns.length === 0 && (
                <p className="text-xs text-muted-foreground py-3 text-center border border-dashed border-border rounded-lg">광고 캠페인을 추가하세요</p>
              )}
              {campaigns.map((c, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-end bg-secondary/40 p-2 rounded-lg">
                  <div>
                    <span className="text-[11px] text-muted-foreground">매체</span>
                    <Input className="h-8 text-xs mt-0.5" placeholder="메타" value={c.medium} onChange={(e) => updateCampaign(i, { medium: e.target.value })} />
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground">금액(₩)</span>
                    <Input type="number" className="h-8 text-xs mt-0.5" value={c.amount_krw} onChange={(e) => updateCampaign(i, { amount_krw: e.target.value })} />
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground">시작</span>
                    <Input type="date" className="h-8 text-xs mt-0.5" value={c.start_date} onChange={(e) => updateCampaign(i, { start_date: e.target.value })} />
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground">종료</span>
                    <Input type="date" className="h-8 text-xs mt-0.5" value={c.end_date} onChange={(e) => updateCampaign(i, { end_date: e.target.value })} />
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeCampaign(i)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-right">총 광고비: <span className="font-semibold text-foreground">₩{adTotal.toLocaleString()}</span></p>
          </div>

          <Button className="w-full" onClick={() => save.mutate()} disabled={save.isPending}>저장</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}