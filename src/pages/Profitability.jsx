import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ChannelTable from "@/components/profitability/ChannelTable";
import SalesMarginTable from "@/components/profitability/SalesMarginTable";

export default function Profitability() {
  const { data: channels = [] } = useQuery({
    queryKey: ["sales-channels"],
    queryFn: () => base44.entities.SalesChannel.list("-created_date", 50),
  });
  const { data: projects = [] } = useQuery({
    queryKey: ["sourcing"],
    queryFn: () => base44.entities.SourcingProject.list("-created_date", 100),
  });
  const { data: logisticsList = [] } = useQuery({
    queryKey: ["logistics-cost"],
    queryFn: () => base44.entities.LogisticsCost.list("-created_date", 1),
  });
  const logistics = logisticsList[0];

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">판매 채널 &amp; 수익성</h1>
        <p className="text-sm text-muted-foreground mt-1">
          소싱 원가 + 채널 수수료 + 배송비를 반영한 진짜 순수익(Net Margin)을 표로 비교합니다
        </p>
      </div>

      <ChannelTable channels={channels} logistics={logistics} />
      <SalesMarginTable channels={channels} projects={projects} />
    </div>
  );
}