import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import KpiCards from "@/components/analytics/KpiCards";
import RevenueChart from "@/components/analytics/RevenueChart";
import ChannelRoiChart from "@/components/analytics/ChannelRoiChart";
import RepurchaseChart from "@/components/analytics/RepurchaseChart";
import ConversionFunnelChart from "@/components/analytics/ConversionFunnelChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp } from "lucide-react";
import AiTaskRecommender from "@/components/shared/AiTaskRecommender";
import { subDays, isAfter, parseISO, format, startOfMonth } from "date-fns";

const PERIOD_OPTIONS = [
  { value: "7", label: "최근 7일" },
  { value: "30", label: "최근 30일" },
  { value: "90", label: "최근 90일" },
  { value: "all", label: "전체" },
];

export default function Analytics() {
  const [period, setPeriod] = useState("30");
  const [channel, setChannel] = useState("all");

  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => base44.entities.Order.list("-created_date", 500),
    initialData: [],
  });

  const channels = useMemo(() => {
    const ch = [...new Set(orders.map((o) => o.channel).filter(Boolean))];
    return ch;
  }, [orders]);

  const filtered = useMemo(() => {
    let result = orders;
    if (period !== "all") {
      const cutoff = subDays(new Date(), parseInt(period));
      result = result.filter((o) => {
        const d = o.order_date ? parseISO(o.order_date) : o.created_date ? new Date(o.created_date) : null;
        return d && isAfter(d, cutoff);
      });
    }
    if (channel !== "all") {
      result = result.filter((o) => o.channel === channel);
    }
    return result;
  }, [orders, period, channel]);

  return (
    <div className="px-6 md:px-10 py-8 md:py-12 max-w-[1600px] mx-auto">
      {/* 헤더 */}
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">CDO Analytics</p>
          <h1 className="font-serif text-4xl text-foreground tracking-tight">KPI 대시보드</h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-500" />
            CDO AI 분석 기반 · 넬리아 헤어드라이어 성과 지표
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="w-44 h-10">
              <SelectValue placeholder="전체 채널" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 채널</SelectItem>
              {channels.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI 카드 */}
      <KpiCards orders={filtered} allOrders={orders} period={period} />

      {/* 차트 2x2 그리드 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <RevenueChart orders={filtered} period={period} />
        <ChannelRoiChart orders={filtered} />
        <RepurchaseChart orders={filtered} allOrders={orders} />
        <ConversionFunnelChart orders={filtered} />
      </div>

      {/* AI 태스크 추천 */}
      <div className="mt-8">
        <AiTaskRecommender context="analytics" />
      </div>
    </div>
  );
}