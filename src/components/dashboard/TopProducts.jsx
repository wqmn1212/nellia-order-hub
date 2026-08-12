import React from "react";
import { Card } from "@/components/ui/card";

export default function TopProducts({ orders, limit = 5 }) {
  const map = {};
  orders
    .filter((o) => o.status !== "cancelled" && o.product_name)
    .forEach((o) => {
      const key = o.product_name;
      if (!map[key]) map[key] = { name: key, units: 0, revenue: 0 };
      map[key].units += o.quantity || 1;
      map[key].revenue += o.price || 0;
    });

  const rows = Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, limit);
  const max = rows[0]?.revenue || 1;

  return (
    <Card className="border-border/70 p-6 shadow-sm">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Best Sellers</p>
        <h3 className="font-serif text-xl">상품별 판매 성과</h3>
      </div>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">판매 데이터가 없습니다</p>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.name}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <p className="truncate text-sm">{r.name}</p>
                <p className="shrink-0 text-sm font-medium">₩{r.revenue.toLocaleString()}</p>
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary">
                <div className="h-1.5 rounded-full bg-primary" style={{ width: `${(r.revenue / max) * 100}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{r.units.toLocaleString()}개 판매</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}