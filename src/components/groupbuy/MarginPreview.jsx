import React from "react";
import { calculateGroupBuy, formatWon } from "@/lib/groupBuyCalculations";

export default function MarginPreview({ item }) {
  const value = calculateGroupBuy(item);
  const rows = [["공동구매 가격", item.sale_price], ["제품 원가", -item.unit_cost], [`수수료 (${item.commission_rate || 0}%)`, -value.commission], ["택배비", -item.shipping_fee], ["부가세 (판매가의 1/11)", -value.vat]];
  return <div className="rounded-xl border bg-card p-5"><h3 className="font-semibold mb-4">건당 마진 계산</h3><div className="space-y-3">{rows.map(([label, amount], index) => <div key={label} className="flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><span>{index ? `-${formatWon(Math.abs(amount || 0))}` : formatWon(amount)}</span></div>)}<div className="flex justify-between border-t pt-3 font-semibold"><span>우리 수익</span><span className={value.unitProfit < 0 ? "text-destructive" : "text-primary"}>{formatWon(value.unitProfit)} ({value.marginRate.toFixed(1)}%)</span></div></div></div>;
}