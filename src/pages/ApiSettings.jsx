import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import ChannelConfigCard from "@/components/api/ChannelConfigCard";
import SyncGuideCard from "@/components/api/SyncGuideCard";
import OrderSyncPanel from "@/components/api/OrderSyncPanel";

export default function ApiSettings() {
  const queryClient = useQueryClient();

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["api-configs"],
    queryFn: () => base44.entities.ApiConfig.list(),
  });

  const coupangConfig = configs.find((c) => c.channel === "coupang");
  const naverConfig = configs.find((c) => c.channel === "naver");

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-semibold text-foreground">API 연동 설정</h1>
        <p className="text-sm text-muted-foreground mt-1">
          판매 채널 API 키를 등록하면 광고 성과와 주문이 자동으로 동기화됩니다.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ChannelConfigCard
          channel="coupang"
          config={coupangConfig}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["api-configs"] })}
        />
        <ChannelConfigCard
          channel="naver"
          config={naverConfig}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["api-configs"] })}
        />
      </div>

      <OrderSyncPanel />

      <SyncGuideCard />
    </div>
  );
}