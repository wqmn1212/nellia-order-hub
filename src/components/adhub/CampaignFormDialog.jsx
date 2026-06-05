import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PLATFORMS } from "./adConstants";

const EMPTY = { platform: "meta", campaign_name: "", external_campaign_id: "", daily_budget_krw: 0, status: "active" };

export default function CampaignFormDialog({ open, onOpenChange, campaign }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) setForm(campaign ? { ...EMPTY, ...campaign } : EMPTY);
  }, [open, campaign]);

  const save = useMutation({
    mutationFn: (data) =>
      campaign
        ? base44.entities.AdCampaign.update(campaign.id, data)
        : base44.entities.AdCampaign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adCampaigns"] });
      onOpenChange(false);
    },
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{campaign ? "캠페인 수정" : "캠페인 추가"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">매체</Label>
            <Select value={form.platform} onValueChange={(v) => set("platform", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => <SelectItem key={p.key} value={p.key}>{p.emoji} {p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">캠페인 이름</Label>
            <Input value={form.campaign_name} onChange={(e) => set("campaign_name", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">매체 캠페인 ID (선택)</Label>
            <Input value={form.external_campaign_id || ""} onChange={(e) => set("external_campaign_id", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">일일 예산 (₩)</Label>
            <Input type="number" value={form.daily_budget_krw} onChange={(e) => set("daily_budget_krw", Number(e.target.value))} />
          </div>
          <div>
            <Label className="text-xs">상태</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">ON (활성)</SelectItem>
                <SelectItem value="paused">OFF (중지)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={() => save.mutate(form)} disabled={!form.campaign_name || save.isPending}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}