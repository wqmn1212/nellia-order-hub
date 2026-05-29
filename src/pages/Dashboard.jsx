import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Package, Clock, Truck, CheckCircle2 } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import ChannelBreakdown from "@/components/dashboard/ChannelBreakdown";
import RecentOrders from "@/components/dashboard/RecentOrders";
import AiOrderAnalysis from "@/components/dashboard/AiOrderAnalysis";
import StockAlert from "@/components/dashboard/StockAlert";
import TaskFeed from "@/components/dashboard/TaskFeed";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function Dashboard() {
  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => base44.entities.Order.list("-created_date", 500),
    initialData: [],
  });

  const today = new Date().toISOString().split("T")[0];
  const todayOrders = orders.filter((o) => o.order_date === today);
  const newCount = orders.filter((o) => o.status === "new").length;
  const preparingCount = orders.filter((o) => o.status === "preparing").length;
  const shippedCount = orders.filter((o) => o.status === "shipped").length;

  return (
    <div className="px-6 md:px-10 py-8 md:py-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">
          {format(new Date(), "yyyy년 M월 d일 EEEE", { locale: ko })}
        </p>
        <h1 className="font-serif text-4xl md:text-5xl text-foreground tracking-tight">
          안녕하세요, <span className="italic text-primary">Nellia</span>
        </h1>
        <p className="text-muted-foreground mt-2">오늘의 주문 현황을 한눈에 확인하세요</p>
      </div>

      {/* 재고 부족 알림 */}
      <StockAlert />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="오늘 주문" value={todayOrders.length} sublabel="오늘 접수된 건수" icon={Package} accent="primary" />
        <StatsCard label="신규 주문" value={newCount} sublabel="처리 대기" icon={Clock} accent="amber" />
        <StatsCard label="출고 준비" value={preparingCount} sublabel="송장 작업 중" icon={Truck} accent="primary" />
        <StatsCard label="출고 완료" value={shippedCount} sublabel="배송 진행중" icon={CheckCircle2} accent="emerald" />
      </div>

      {/* Split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-3">
          <RecentOrders orders={orders} />
        </div>
        <div className="lg:col-span-2">
          <ChannelBreakdown orders={orders} />
        </div>
      </div>

      {/* 업무 피드 + AI 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-2">
          <TaskFeed />
        </div>
        <div className="lg:col-span-3">
          <AiOrderAnalysis orders={orders} />
        </div>
      </div>
    </div>
  );
}