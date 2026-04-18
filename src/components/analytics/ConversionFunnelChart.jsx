import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const STATUS_LABELS = {
  new: { label: "신규 주문", color: "bg-amber-400" },
  preparing: { label: "출고 준비", color: "bg-blue-400" },
  shipped: { label: "출고 완료", color: "bg-emerald-400" },
  delivered: { label: "배송 완료", color: "bg-violet-500" },
  cancelled: { label: "취소", color: "bg-red-400" },
};

const FUNNEL_STEPS = ["new", "preparing", "shipped", "delivered"];

export default function ConversionFunnelChart({ orders }) {
  const data = useMemo(() => {
    const total = orders.length || 1;
    return FUNNEL_STEPS.map((status) => {
      const count = orders.filter((o) => o.status === status).length;
      const pct = ((count / total) * 100).toFixed(1);
      return { status, count, pct };
    });
  }, [orders]);

  const cancelled = orders.filter((o) => o.status === "cancelled").length;
  const total = orders.length;

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">주문 전환 퍼널</CardTitle>
        <p className="text-xs text-muted-foreground">주문 상태별 전환 흐름 · 취소 {cancelled}건 제외</p>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        {data.map((d, i) => {
          const cfg = STATUS_LABELS[d.status];
          const width = data[0].count > 0 ? ((d.count / data[0].count) * 100).toFixed(0) : 0;
          return (
            <div key={d.status}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.color}`} />
                  <span className="text-sm text-foreground">{cfg.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{d.pct}%</span>
                  <span className="text-sm font-bold text-foreground w-10 text-right">{d.count}건</span>
                </div>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${cfg.color}`}
                  style={{ width: `${width}%` }}
                />
              </div>
              {i < data.length - 1 && data[i + 1].count > 0 && (
                <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
                  → 다음 단계 전환: {data[0].count > 0 ? ((data[i + 1].count / data[i].count) * 100).toFixed(0) : 0}%
                </p>
              )}
            </div>
          );
        })}
        <div className="pt-2 border-t border-border flex justify-between text-sm">
          <span className="text-muted-foreground">전체 주문</span>
          <span className="font-bold">{total}건</span>
        </div>
      </CardContent>
    </Card>
  );
}