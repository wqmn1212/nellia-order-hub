import React from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { CHANNELS } from "@/components/shared/constants";

export default function ChannelPerformance({ orders }) {
  const map = {};
  orders
    .filter((o) => o.status !== "cancelled")
    .forEach((o) => {
      const key = o.channel || "other";
      if (!map[key]) map[key] = { label: CHANNELS[key]?.label || key, revenue: 0, units: 0, count: 0 };
      map[key].revenue += o.price || 0;
      map[key].units += o.quantity || 1;
      map[key].count += 1;
    });

  const rows = Object.values(map).sort((a, b) => b.revenue - a.revenue);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0) || 1;

  return (
    <Card className="border-border/70 p-6 shadow-sm">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Channels</p>
        <h3 className="font-serif text-xl">채널별 실적 비교</h3>
      </div>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">주문 데이터가 없습니다</p>
      ) : (
        <>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${Math.round(v / 10000)}만`} />
                <Tooltip formatter={(v) => `₩${Number(v).toLocaleString()}`} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{r.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  ₩{r.revenue.toLocaleString()} · {r.units}개 · 비중 {Math.round((r.revenue / totalRevenue) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}