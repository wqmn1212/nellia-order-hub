import React from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, ShoppingBag, Wallet, Receipt } from "lucide-react";

const won = (n) => `₩${Math.round(n).toLocaleString()}`;

export default function SalesOverview({ orders }) {
  const valid = orders.filter((o) => o.status !== "cancelled");
  const monthPrefix = new Date().toISOString().slice(0, 7);

  const totalUnits = valid.reduce((s, o) => s + (o.quantity || 1), 0);
  const totalRevenue = valid.reduce((s, o) => s + (o.price || 0), 0);
  const monthOrders = valid.filter((o) => (o.order_date || "").startsWith(monthPrefix));
  const monthRevenue = monthOrders.reduce((s, o) => s + (o.price || 0), 0);
  const aov = valid.length ? totalRevenue / valid.length : 0;

  const stats = [
    { label: "총 판매 수량", value: totalUnits.toLocaleString(), sub: `주문 ${valid.length}건`, icon: ShoppingBag },
    { label: "누적 매출", value: won(totalRevenue), sub: "취소 제외", icon: Wallet },
    { label: "이번달 매출", value: won(monthRevenue), sub: `${monthOrders.length}건`, icon: TrendingUp },
    { label: "평균 주문금액", value: won(aov), sub: "AOV", icon: Receipt },
  ];

  return (
    <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <Card key={s.label} className="border-border/70 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">{s.label}</p>
                <p className="mt-2 truncate font-serif text-2xl text-foreground">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}