import React from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function CostMarginCard({ project, channels, fixedCost }) {
  const qty = project.total_order_qty || 0;
  const perUnit = qty > 0 ? Math.round((project.total_landed_cost_krw || 0) / qty) : 0;
  const won = (n) => `₩${Math.round(n).toLocaleString()}`;

  // assume a reference sale price of 2.8x cost for a quick margin readout
  const refPrice = perUnit ? Math.round(perUnit * 2.8) : 0;
  const margins = channels.map((c) => {
    const commission = Math.round(refPrice * ((c.commission_rate || 0) / 100));
    const profit = refPrice - perUnit - commission - fixedCost;
    return { name: c.channel_name, profit };
  });
  const best = margins.reduce((a, b) => (b.profit > (a?.profit ?? -Infinity) ? b : a), null);
  const worst = margins.reduce((a, b) => (b.profit < (a?.profit ?? Infinity) ? b : a), null);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm">{project.product_name}</p>
        <span className="text-xs text-muted-foreground">진짜 원가</span>
      </div>
      <p className="text-2xl font-bold text-red-600 tabular-nums">{won(perUnit)}</p>
      {best && refPrice > 0 && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="rounded-lg bg-emerald-50 p-2.5">
            <div className="flex items-center gap-1 text-emerald-600 text-xs">
              <TrendingUp className="w-3.5 h-3.5" /> 최고 ({best.name})
            </div>
            <p className="text-sm font-semibold text-emerald-700 tabular-nums mt-0.5">{won(best.profit)}</p>
          </div>
          <div className="rounded-lg bg-secondary p-2.5">
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <TrendingDown className="w-3.5 h-3.5" /> 최저 ({worst.name})
            </div>
            <p className="text-sm font-semibold text-foreground tabular-nums mt-0.5">{won(worst.profit)}</p>
          </div>
        </div>
      )}
      {refPrice > 0 && <p className="text-[11px] text-muted-foreground">판매가 {won(refPrice)} 기준 (원가 2.8배)</p>}
    </Card>
  );
}