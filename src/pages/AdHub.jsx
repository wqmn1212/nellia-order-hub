import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Megaphone } from "lucide-react";
import PlatformSummaryCards from "@/components/adhub/PlatformSummaryCards";
import AdTrendChart from "@/components/adhub/AdTrendChart";
import AiInsightsPanel from "@/components/adhub/AiInsightsPanel";
import CampaignControlTable from "@/components/adhub/CampaignControlTable";
import PerformanceTable from "@/components/adhub/PerformanceTable";

export default function AdHub() {
  const { data: adRows = [] } = useQuery({
    queryKey: ["adPerformance"],
    queryFn: () => base44.entities.AdPerformance.list("-date", 500),
    initialData: [],
  });
  const { data: campaigns = [] } = useQuery({
    queryKey: ["adCampaigns"],
    queryFn: () => base44.entities.AdCampaign.list("-created_date", 200),
    initialData: [],
  });
  const { data: orders = [] } = useQuery({
    queryKey: ["adHubOrders"],
    queryFn: () => base44.entities.Order.list("-order_date", 500),
    initialData: [],
  });

  return (
    <div className="p-4 md:p-8 max-w-[100rem] mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Megaphone className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-serif font-semibold">통합 광고 관리 (Ad-Hub)</h1>
          <p className="text-sm text-muted-foreground">5대 매체 성과를 한곳에서 분석하고 AI로 최적화합니다</p>
        </div>
      </div>

      <PlatformSummaryCards rows={adRows} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdTrendChart adRows={adRows} orders={orders} />
        <AiInsightsPanel rows={adRows} />
      </div>

      <CampaignControlTable campaigns={campaigns} />

      <PerformanceTable rows={adRows} />
    </div>
  );
}