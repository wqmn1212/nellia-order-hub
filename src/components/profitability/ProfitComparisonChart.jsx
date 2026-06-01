import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";

export default function ProfitComparisonChart({ data }) {
  if (!data.length) {
    return <p className="text-sm text-muted-foreground text-center py-8">채널을 추가하면 비교 차트가 표시됩니다.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 56)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 48, top: 8, bottom: 8 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(v) => `₩${Math.round(v).toLocaleString()}`}
          cursor={{ fill: "hsl(var(--secondary))" }}
        />
        <Bar dataKey="profit" radius={[0, 6, 6, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.profit >= 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))"} />
          ))}
          <LabelList dataKey="profit" position="right" formatter={(v) => `₩${Math.round(v).toLocaleString()}`} style={{ fontSize: 11, fill: "hsl(var(--foreground))" }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}