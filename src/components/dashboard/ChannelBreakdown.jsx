import React from "react";
import { Card } from "@/components/ui/card";
import { CHANNELS } from "@/components/shared/constants";

export default function ChannelBreakdown({ orders }) {
  const channelCounts = Object.keys(CHANNELS).map((key) => ({
    key,
    ...CHANNELS[key],
    count: orders.filter((o) => o.channel === key).length,
  }));

  const total = orders.length || 1;

  return (
    <Card className="p-7 border-border/70 shadow-sm">
      <div className="flex items-baseline justify-between mb-6">
        <h3 className="font-serif text-xl text-foreground">채널별 주문 분포</h3>
        <span className="text-xs text-muted-foreground">전체 {orders.length}건</span>
      </div>
      <div className="space-y-4">
        {channelCounts
          .filter((c) => c.count > 0)
          .sort((a, b) => b.count - a.count)
          .map((c) => {
            const pct = Math.round((c.count / total) * 100);
            return (
              <div key={c.key}>
                <div className="flex items-center justify-between mb-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                    <span className="text-foreground font-medium">{c.label}</span>
                  </div>
                  <span className="text-muted-foreground tabular-nums">
                    {c.count}건 · {pct}%
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${c.dot} rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        {channelCounts.every((c) => c.count === 0) && (
          <p className="text-sm text-muted-foreground text-center py-8">아직 주문이 없습니다</p>
        )}
      </div>
    </Card>
  );
}