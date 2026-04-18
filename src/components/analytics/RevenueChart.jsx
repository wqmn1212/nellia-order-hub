import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { format, parseISO, subDays, eachDayOfInterval } from "date-fns";

export default function RevenueChart({ orders, period }) {
  const data = useMemo(() => {
    const days = period === "all" ? 30 : parseInt(period);
    const end = new Date();
    const start = subDays(end, days - 1);
    const allDays = eachDayOfInterval({ start, end });

    return allDays.map((day) => {
      const label = format(day, "MM/dd");
      const dayStr = format(day, "yyyy-MM-dd");
      const dayOrders = orders.filter((o) => {
        const d = o.order_date || (o.created_date ? o.created_date.split("T")[0] : null);
        return d === dayStr;
      });
      const revenue = dayOrders.reduce((sum, o) => sum + (o.price || 0), 0);
      return { date: label, 매출: revenue, 주문수: dayOrders.length };
    });
  }, [orders, period]);

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">일별 매출 추이</CardTitle>
        <p className="text-xs text-muted-foreground">기간별 매출 및 주문량</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6d28d9" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#6d28d9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 10000 ? `${(v/10000).toFixed(0)}만` : v} />
            <Tooltip
              formatter={(v, name) => name === "매출" ? [`₩${v.toLocaleString()}`, "매출"] : [v, "주문수"]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e0d8" }}
            />
            <Area type="monotone" dataKey="매출" stroke="#6d28d9" strokeWidth={2} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}