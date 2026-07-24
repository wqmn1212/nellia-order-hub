import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { calculateGroupBuy, formatWon } from "@/lib/groupBuyCalculations";

export default function GroupBuyStats({ items }) {
  const totals = items.reduce((sum, item) => { const value = calculateGroupBuy(item); return { quantity: sum.quantity + (Number(item.sold_quantity) || 0), revenue: sum.revenue + value.revenue, profit: sum.profit + value.totalProfit }; }, { quantity: 0, revenue: 0, profit: 0 });
  const cards = [["공동구매 건수", `${items.length}건`], ["총 판매수량", `${totals.quantity.toLocaleString()}개`], ["총 매출", formatWon(totals.revenue)], ["예상 총수익", formatWon(totals.profit)]];
  return <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">{cards.map(([label, value]) => <Card key={label}><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="text-xl font-semibold mt-1">{value}</p></CardContent></Card>)}</div>;
}