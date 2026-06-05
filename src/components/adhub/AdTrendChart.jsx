import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

export default function AdTrendChart({ adRows, orders }) {
  const data = useMemo(() => {
    const byDate = {};
    adRows.forEach((r) => {
      const d = r.date;
      if (!d) return;
      byDate[d] = byDate[d] || { date: d, spend: 0, sales: 0 };
      byDate[d].spend += Number(r.spend_krw) || 0;
    });
    orders.forEach((o) => {
      const d = o.order_date;
      if (!d) return;
      byDate[d] = byDate[d] || { date: d, spend: 0, sales: 0 };
      byDate[d].sales += Number(o.quantity) || 1;
    });
    return Object.values(byDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30)
      .map((x) => ({ ...x, label: format(new Date(x.date), "M/d") }));
  }, [adRows, orders]);

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold mb-4">일자별 광고 지출 vs 판매량</h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">표시할 데이터가 없습니다</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(v, name) => (name === "광고 지출" ? `₩${Number(v).toLocaleString()}` : `${v}건`)}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="spend" name="광고 지출" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={18} />
            <Line yAxisId="right" type="monotone" dataKey="sales" name="판매량" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}