import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from "recharts";

const CHANNEL_LABELS = {
  coupang: "쿠팡",
  naver: "네이버",
  wadiz: "와디즈",
  toss: "토스",
  kakao: "카카오",
  self_mall: "자사몰",
  other: "기타",
};

const COLORS = ["#6d28d9", "#e11d48", "#047857", "#d97706", "#0284c7", "#db2777", "#64748b"];

export default function ChannelRoiChart({ orders }) {
  const data = useMemo(() => {
    const grouped = {};
    orders.forEach((o) => {
      const ch = o.channel || "other";
      if (!grouped[ch]) grouped[ch] = { revenue: 0, orders: 0 };
      grouped[ch].revenue += o.price || 0;
      grouped[ch].orders += 1;
    });

    return Object.entries(grouped)
      .map(([ch, d]) => ({
        채널: CHANNEL_LABELS[ch] || ch,
        매출: d.revenue,
        주문수: d.orders,
        AOV: d.orders > 0 ? Math.round(d.revenue / d.orders) : 0,
      }))
      .sort((a, b) => b.매출 - a.매출);
  }, [orders]);

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">채널별 매출 및 AOV</CardTitle>
        <p className="text-xs text-muted-foreground">채널별 총매출 · 평균 주문금액 비교</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
            <XAxis dataKey="채널" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 10000 ? `${(v/10000).toFixed(0)}만` : v} />
            <Tooltip
              formatter={(v, name) => name === "매출" ? [`₩${v.toLocaleString()}`, "매출"] : name === "AOV" ? [`₩${v.toLocaleString()}`, "평균주문금액"] : [v, name]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e0d8" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="매출" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}