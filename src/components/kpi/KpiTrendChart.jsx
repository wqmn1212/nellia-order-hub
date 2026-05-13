import React from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer
} from "recharts";

const COLORS = ["#2d5a3d", "#c9a96e", "#4f86c6", "#e05c5c", "#8b5cf6"];

export default function KpiTrendChart({ data, metrics, title }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="font-serif text-lg text-foreground mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e2d9" />
          <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#888" }} />
          <YAxis tick={{ fontSize: 11, fill: "#888" }} width={40} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e8e2d9" }}
            formatter={(v, name) => [`${v?.toLocaleString()}`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {metrics.map((m, i) => (
            <Line
              key={m.key}
              type="monotone"
              dataKey={m.key}
              name={m.label}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}