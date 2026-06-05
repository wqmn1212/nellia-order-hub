import React from "react";
import { Card } from "@/components/ui/card";
import { PLATFORMS, aggregate, won } from "./adConstants";

export default function PlatformSummaryCards({ rows }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {PLATFORMS.map((p) => {
        const m = aggregate(rows.filter((r) => r.platform === p.key));
        const lowRoas = m.spend > 0 && m.roas < 200;
        return (
          <Card key={p.key} className="p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full" style={{ background: p.color }} />
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <span>{p.emoji}</span> {p.label}
              </span>
              {lowRoas && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">효율 저하</span>}
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">지출</span>
                <span className="font-semibold tabular-nums">{won(m.spend)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">ROAS</span>
                <span className={`font-semibold tabular-nums ${lowRoas ? "text-destructive" : "text-emerald-600"}`}>{m.roas}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">CPC</span>
                <span className="font-semibold tabular-nums">{won(m.cpc)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">전환</span>
                <span className="font-semibold tabular-nums">{m.conversions.toLocaleString()}건</span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}