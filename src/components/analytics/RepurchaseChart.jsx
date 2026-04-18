import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const COLORS = ["#6d28d9", "#e5e7eb"];

export default function RepurchaseChart({ orders, allOrders }) {
  const { pieData, topRepurchasers } = useMemo(() => {
    // 재구매 분석 (전체 주문 기준)
    const phoneCounts = {};
    const phoneChannels = {};
    allOrders.forEach((o) => {
      if (!o.customer_phone) return;
      phoneCounts[o.customer_phone] = (phoneCounts[o.customer_phone] || 0) + 1;
      if (!phoneChannels[o.customer_phone]) phoneChannels[o.customer_phone] = new Set();
      if (o.channel) phoneChannels[o.customer_phone].add(o.channel);
    });

    const total = Object.keys(phoneCounts).length;
    const repeat = Object.values(phoneCounts).filter((c) => c >= 2).length;
    const single = total - repeat;

    const pieData = [
      { name: "재구매 고객", value: repeat },
      { name: "신규 고객", value: single },
    ];

    // 채널별 재구매 고객 수
    const channelRepeat = {};
    Object.entries(phoneCounts).forEach(([phone, count]) => {
      if (count >= 2) {
        phoneChannels[phone]?.forEach((ch) => {
          channelRepeat[ch] = (channelRepeat[ch] || 0) + 1;
        });
      }
    });

    const topRepurchasers = Object.entries(channelRepeat)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([ch, cnt]) => ({ ch, cnt }));

    return { pieData, topRepurchasers };
  }, [allOrders]);

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">고객 재구매율</CardTitle>
        <p className="text-xs text-muted-foreground">헤어드라이어 구매 고객 충성도 분석</p>
      </CardHeader>
      <CardContent className="flex items-center gap-6">
        <ResponsiveContainer width={160} height={200}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={3}
              dataKey="value"
            >
              {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
            </Pie>
            <Tooltip
              formatter={(v, name) => [v + "명", name]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e0d8" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-3">
          {pieData.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i] }} />
              <span className="text-sm text-muted-foreground flex-1">{d.name}</span>
              <span className="font-bold text-sm">{d.value}명</span>
            </div>
          ))}
          {topRepurchasers.length > 0 && (
            <div className="pt-2 border-t border-border">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">채널별 재구매</p>
              {topRepurchasers.map((r) => (
                <div key={r.ch} className="flex justify-between text-xs py-0.5">
                  <span className="text-muted-foreground">{r.ch}</span>
                  <span className="font-semibold">{r.cnt}명</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}