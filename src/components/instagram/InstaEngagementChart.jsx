import React from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

export default function InstaEngagementChart({ posts }) {
  // Oldest → newest, labelled by date, per-post core metrics
  const data = [...posts]
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map((p, i) => ({
      name: p.timestamp ? new Date(p.timestamp).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }) : `#${i + 1}`,
      좋아요: p.likes || 0,
      댓글: p.comments || 0,
      조회수: p.views || 0,
    }));

  if (data.length === 0) return null;

  return (
    <Card className="p-5">
      <p className="text-sm font-medium mb-4">게시물별 핵심 지표</p>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
            formatter={(v) => (v || 0).toLocaleString()}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="좋아요" fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} />
          <Bar dataKey="댓글" fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} />
          <Bar dataKey="조회수" fill="hsl(var(--chart-4))" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}