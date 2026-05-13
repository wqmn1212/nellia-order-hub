import React from "react";
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";

export default function KpiGauge({ label, current, target, unit, color = "#2d5a3d" }) {
  const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 150) : 0;
  const displayPct = Math.min(pct, 100);

  const statusColor =
    pct >= 100 ? "#16a34a" :
    pct >= 70  ? "#ca8a04" :
                 "#dc2626";

  const data = [{ value: displayPct }];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-36 h-36 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="65%" outerRadius="90%"
            startAngle={220} endAngle={-40}
            data={data}
            barSize={12}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: "#f1ede6" }}
              dataKey="value"
              cornerRadius={6}
              fill={statusColor}
              angleAxisId={0}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color: statusColor }}>{pct}%</span>
          <span className="text-[10px] text-muted-foreground">달성률</span>
        </div>
      </div>
      <p className="text-sm font-medium text-foreground text-center leading-tight">{label}</p>
      <p className="text-xs text-muted-foreground">
        {current?.toLocaleString()}{unit} / {target?.toLocaleString()}{unit}
      </p>
    </div>
  );
}