import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Ship, Calculator } from "lucide-react";
import ShipmentSummaryCard from "@/components/summary/ShipmentSummaryCard";
import CostMarginCard from "@/components/summary/CostMarginCard";

export default function MobileSummary() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["sourcing"],
    queryFn: () => base44.entities.SourcingProject.list("-created_date", 50),
  });
  const { data: channels = [] } = useQuery({
    queryKey: ["sales-channels"],
    queryFn: () => base44.entities.SalesChannel.list("-created_date", 50),
  });
  const { data: logisticsList = [] } = useQuery({
    queryKey: ["logistics-cost"],
    queryFn: () => base44.entities.LogisticsCost.list("-created_date", 1),
  });
  const logistics = logisticsList[0];
  const fixedCost = (logistics?.box_cost_krw || 0) + (logistics?.delivery_fee_krw || 0);

  const shipping = projects.filter((p) => p.etd || p.eta || p.production_start_date);
  const costed = projects.filter((p) => p.total_landed_cost_krw);

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6 pb-24">
      <div>
        <h1 className="font-serif text-xl text-foreground">현황 요약</h1>
        <p className="text-sm text-muted-foreground mt-0.5">선적 일정 · 원가 · 채널 마진을 한눈에</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Ship className="w-4 h-4 text-primary" /> 선적 현황
            </div>
            {shipping.length === 0 ? (
              <p className="text-sm text-muted-foreground">등록된 선적 일정이 없습니다.</p>
            ) : (
              shipping.map((p) => <ShipmentSummaryCard key={p.id} project={p} />)
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Calculator className="w-4 h-4 text-primary" /> 원가 &amp; 채널 마진
            </div>
            {costed.length === 0 ? (
              <p className="text-sm text-muted-foreground">원가가 계산된 프로젝트가 없습니다.</p>
            ) : (
              costed.map((p) => (
                <CostMarginCard key={p.id} project={p} channels={channels} fixedCost={fixedCost} />
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}