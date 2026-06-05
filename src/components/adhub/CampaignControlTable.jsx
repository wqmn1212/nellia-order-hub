import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { PLATFORM_MAP, won } from "./adConstants";

export default function CampaignControlTable({ campaigns }) {
  const queryClient = useQueryClient();
  const toggle = useMutation({
    mutationFn: ({ id, status }) => base44.entities.AdCampaign.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adCampaigns"] }),
  });

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold mb-1">라이브 캠페인 원격 제어</h3>
      <p className="text-xs text-muted-foreground mb-4">스위치로 캠페인을 ON/OFF 합니다 (매체 API 연동은 2차 개발)</p>
      <div className="space-y-2">
        {campaigns.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border rounded-lg">등록된 캠페인이 없습니다</p>
        )}
        {campaigns.map((c) => {
          const p = PLATFORM_MAP[c.platform];
          const active = c.status === "active";
          return (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40">
              <span className="text-base">{p?.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.campaign_name}</p>
                <p className="text-xs text-muted-foreground">{p?.label} · 일예산 {won(c.daily_budget_krw)}</p>
              </div>
              <span className={`text-xs font-medium ${active ? "text-emerald-600" : "text-muted-foreground"}`}>
                {active ? "ON" : "OFF"}
              </span>
              <Switch
                checked={active}
                onCheckedChange={(v) => toggle.mutate({ id: c.id, status: v ? "active" : "paused" })}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}