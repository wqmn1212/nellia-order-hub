import React from "react";
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format, subDays } from "date-fns";

export default function RevenueTrendChart({ orders, days = 14 }) {
  const buckets = Array.from({ length: days }, (_, i) => {
    const d = subDays(new Date(), days - 1 - i);
    const key = d.toISOString().slice(0, 10);
    return { key, label: format(d, "M/d"), revenue: 0, units: 0 };
  });
  const index = Object.fromEntries(buckets.map((b) => [b.key, b]));

  orders
    .filter((o) => o.status !== "cancelled" && o.order_date)
    .forEach((o) => {
      const b = index[o.order_date];
      if (!b) return;
      b.revenue += o.price || 0;
      b.units += o.quantity || 1;
    });

  return (
    <Card className="border-border/70 p-6 shadow-sm">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Revenue</p>
        <h3 className="font-serif text-xl">최근 {days}일 매출 추이</h3>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={buckets}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${Math.round(v / 10000)}만`} />
            <Tooltip
              formatter={(v, name) => (name === "revenue" ? [`₩${v.toLocaleString()}`, "매출"] : [v, "수량"])}
              labelFormatter={(l) => `${l}`}
            />
            <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}