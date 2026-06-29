import React from "react";
import { Card } from "@/components/ui/card";
import { Boxes, AlertTriangle, XCircle, Layers } from "lucide-react";

export default function InventoryStatsCards({ products }) {
  const totalStock = products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);
  const skuCount = products.length;
  const lowStock = products.filter(
    (p) => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= (p.stock_alert_threshold ?? 10)
  ).length;
  const outOfStock = products.filter((p) => (p.stock_quantity || 0) <= 0).length;

  const stats = [
    { label: "총 재고 수량", value: totalStock.toLocaleString(), unit: "개", icon: Boxes, color: "text-primary" },
    { label: "제품 종류 (SKU)", value: skuCount.toLocaleString(), unit: "종", icon: Layers, color: "text-blue-600" },
    { label: "재고 부족", value: lowStock.toLocaleString(), unit: "종", icon: AlertTriangle, color: "text-amber-600" },
    { label: "품절", value: outOfStock.toLocaleString(), unit: "종", icon: XCircle, color: "text-rose-600" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <Card key={s.label} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <Icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold mt-2">
              {s.value}<span className="text-sm font-normal text-muted-foreground ml-1">{s.unit}</span>
            </p>
          </Card>
        );
      })}
    </div>
  );
}