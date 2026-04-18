import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ShoppingBag, RefreshCw, BarChart2, DollarSign } from "lucide-react";

function KpiCard({ icon: Icon, label, value, sub, trend, color }) {
  const isPositive = trend >= 0;
  return (
    <Card className="p-5 border-border/70 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </Card>
  );
}

export default function KpiCards({ orders, allOrders, period }) {
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.price || 0), 0);
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const cancelled = orders.filter((o) => o.status === "cancelled").length;
    const total = orders.length;

    // 전환율: shipped+delivered / 전체
    const converted = orders.filter((o) => ["shipped", "delivered"].includes(o.status)).length;
    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : 0;

    // 평균 주문 금액
    const aov = total > 0 ? Math.round(totalRevenue / total) : 0;

    // 재구매율: 같은 phone이 2회 이상 주문
    const phoneCounts = {};
    allOrders.forEach((o) => {
      if (o.customer_phone) phoneCounts[o.customer_phone] = (phoneCounts[o.customer_phone] || 0) + 1;
    });
    const repeatCustomers = Object.values(phoneCounts).filter((c) => c >= 2).length;
    const totalCustomers = Object.keys(phoneCounts).length;
    const repurchaseRate = totalCustomers > 0 ? ((repeatCustomers / totalCustomers) * 100).toFixed(1) : 0;

    return { totalRevenue, conversionRate, aov, repurchaseRate, total, cancelled };
  }, [orders, allOrders]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KpiCard
        icon={DollarSign}
        label="총 매출"
        value={`₩${(stats.totalRevenue / 10000).toFixed(0)}만`}
        sub={`주문 ${stats.total}건`}
        color="bg-violet-100 text-violet-700"
      />
      <KpiCard
        icon={TrendingUp}
        label="전환율"
        value={`${stats.conversionRate}%`}
        sub="출고+배송 완료 기준"
        color="bg-emerald-100 text-emerald-700"
        trend={2.3}
      />
      <KpiCard
        icon={RefreshCw}
        label="재구매율"
        value={`${stats.repurchaseRate}%`}
        sub="2회 이상 구매 고객"
        color="bg-blue-100 text-blue-700"
        trend={1.1}
      />
      <KpiCard
        icon={ShoppingBag}
        label="평균 주문 금액"
        value={`₩${stats.aov.toLocaleString()}`}
        sub="AOV (헤어드라이어)"
        color="bg-amber-100 text-amber-700"
      />
    </div>
  );
}